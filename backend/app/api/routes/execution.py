import os
import uuid
import json
import io
import pandas as pd
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse
from ...schemas.execution import ExecutionRequest, ExecutionResultResponse
from .datasets import DATASET_STORE, PROFILE_STORE, RECOMMENDATION_STORE, load_dataset_from_db_if_needed
from ...services.execution_engine import CleaningExecutionEngine
from ...services.profiler import Profiler
from ...services.db import get_db_connection, STORAGE_DIR

router = APIRouter(prefix="/datasets", tags=["execution"])

CLEANED_DATASET_STORE = {}
EXECUTION_RESULTS_STORE = {}

def load_cleaned_dataset_from_db_if_needed(dataset_id: str):
    if dataset_id in CLEANED_DATASET_STORE:
        return CLEANED_DATASET_STORE[dataset_id]
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT cleaned_path, execution_result_json FROM datasets WHERE dataset_id = ?", (dataset_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row or not row["cleaned_path"]:
        return None
        
    cleaned_path = row["cleaned_path"]
    if not os.path.exists(cleaned_path):
        return None
        
    if cleaned_path.endswith('.csv'):
        df = pd.read_csv(cleaned_path)
    elif cleaned_path.endswith('.xlsx') or cleaned_path.endswith('.xls'):
        df = pd.read_excel(cleaned_path)
    elif cleaned_path.endswith('.json'):
        df = pd.read_json(cleaned_path)
    else:
        return None
        
    CLEANED_DATASET_STORE[dataset_id] = df
    if row["execution_result_json"]:
        EXECUTION_RESULTS_STORE[dataset_id] = json.loads(row["execution_result_json"])
    return df

@router.post("/{dataset_id}/execute", response_model=ExecutionResultResponse)
async def execute_dataset_cleaning(dataset_id: str, body: ExecutionRequest):
    df = load_dataset_from_db_if_needed(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")
        
    original_df = DATASET_STORE[dataset_id]
    recommendations = RECOMMENDATION_STORE.get(dataset_id, [])
    
    row_count_before = len(original_df)
    col_count_before = len(original_df.columns)
    missing_before = int(original_df.isnull().sum().sum())
    try:
        dup_before = int(original_df.duplicated().sum())
    except Exception:
        dup_before = 0
        
    cleaned_df, audit_log, status = CleaningExecutionEngine.execute_cleaning(
        original_df, recommendations, body.approved_action_ids, dataset_id
    )
    
    execution_id = f"exec_{uuid.uuid4().hex[:10]}"
    
    # Store cleaned dataset securely on disk with "cleaned_" prefix
    os.makedirs(STORAGE_DIR, exist_ok=True)
    profile = PROFILE_STORE.get(dataset_id, {})
    original_filename = profile.get("filename", "dataset.csv")
    base_name = "".join(c for c in original_filename.rsplit('.', 1)[0] if c.isalnum() or c in (' ', '_', '-')).strip().replace(' ', '_')
    extension = original_filename.rsplit('.', 1)[-1].lower() if '.' in original_filename else 'csv'
    
    cleaned_filename = f"cleaned_{base_name}_{dataset_id}.{extension}"
    cleaned_path = os.path.join(STORAGE_DIR, cleaned_filename)
    
    if extension in ['xlsx', 'xls']:
        cleaned_df.to_excel(cleaned_path, index=False)
    else:
        cleaned_df.to_csv(cleaned_path, index=False)
    
    CLEANED_DATASET_STORE[dataset_id] = cleaned_df.copy(deep=True)
    
    row_count_after = len(cleaned_df)
    col_count_after = len(cleaned_df.columns)
    missing_after = int(cleaned_df.isnull().sum().sum())
    try:
        dup_after = int(cleaned_df.duplicated().sum())
    except Exception:
        dup_after = 0
        
    profile_after = Profiler.profile_dataframe(
        cleaned_df, dataset_id, original_filename, 
        cleaned_df.memory_usage(deep=True).sum(), extension
    )
    
    preview_rows = cleaned_df.head(10).to_dict(orient="records")
    
    result_response = {
        "dataset_id": dataset_id,
        "execution_id": execution_id,
        "status": status,
        "original_row_count": row_count_before,
        "final_row_count": row_count_after,
        "original_column_count": col_count_before,
        "final_column_count": col_count_after,
        "total_missing_before": missing_before,
        "total_missing_after": missing_after,
        "duplicate_rows_before": dup_before,
        "duplicate_rows_after": dup_after,
        "audit_log": audit_log,
        "preview_rows": preview_rows,
        "column_profiles_after": profile_after["columns"],
        "message": "Cleaning execution completed successfully."
    }
    
    EXECUTION_RESULTS_STORE[dataset_id] = result_response
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE datasets 
            SET cleaned_path = ?, execution_result_json = ?, status = ?
            WHERE dataset_id = ?
        ''', (cleaned_path, json.dumps(result_response), "cleaned", dataset_id))
        conn.commit()
        conn.close()
    except Exception:
        pass
        
    return result_response

@router.get("/{dataset_id}/cleaning-results")
async def get_cleaning_results(dataset_id: str):
    if dataset_id not in EXECUTION_RESULTS_STORE:
        load_cleaned_dataset_from_db_if_needed(dataset_id)
        if dataset_id not in EXECUTION_RESULTS_STORE:
            raise HTTPException(status_code=404, detail="Cleaning results not found. Execute cleaning first.")
    return EXECUTION_RESULTS_STORE[dataset_id]

@router.get("/{dataset_id}/export")
async def export_cleaned_dataset(dataset_id: str, format: str = "csv"):
    cleaned_df = load_cleaned_dataset_from_db_if_needed(dataset_id)
    if cleaned_df is None:
        cleaned_df = load_dataset_from_db_if_needed(dataset_id)
        if cleaned_df is None:
            raise HTTPException(status_code=404, detail="Dataset not found.")
            
    profile = PROFILE_STORE.get(dataset_id, {})
    original_filename = profile.get("filename", "dataset.csv")
    base_name = original_filename.rsplit('.', 1)[0]
    
    fmt = format.lower()
    if fmt == "xlsx" or fmt == "excel":
        output = io.BytesIO()
        cleaned_df.to_excel(output, index=False)
        output.seek(0)
        filename = f"cleaned_{base_name}.xlsx"
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    else:
        output = io.StringIO()
        cleaned_df.to_csv(output, index=False)
        output.seek(0)
        filename = f"cleaned_{base_name}.csv"
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
