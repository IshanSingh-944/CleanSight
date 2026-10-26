import os
import uuid
import json
from fastapi import APIRouter, UploadFile, File, HTTPException
from ...services.file_loader import FileLoader
from ...services.profiler import Profiler
from ...services.issue_detector import IssueDetector
from ...services.recommendation_engine import RecommendationEngine
from ...services.db import get_db_connection, STORAGE_DIR

router = APIRouter(prefix="/datasets", tags=["datasets"])

DATASET_STORE = {}
PROFILE_STORE = {}
RECOMMENDATION_STORE = {}

def load_dataset_from_db_if_needed(dataset_id: str):
    if dataset_id in DATASET_STORE:
        return DATASET_STORE[dataset_id]
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM datasets WHERE dataset_id = ?", (dataset_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
        
    original_path = row["original_path"]
    if not os.path.exists(original_path):
        return None
        
    if original_path.endswith('.csv'):
        df = pd.read_csv(original_path)
    elif original_path.endswith('.xlsx') or original_path.endswith('.xls'):
        df = pd.read_excel(original_path)
    elif original_path.endswith('.json'):
        df = pd.read_json(original_path)
    else:
        return None
        
    DATASET_STORE[dataset_id] = df
    PROFILE_STORE[dataset_id] = json.loads(row["profile_json"])
    RECOMMENDATION_STORE[dataset_id] = json.loads(row["recommendations_json"])
    return df

@router.post("")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")
        
    contents = await file.read()
    file_size = len(contents)
    
    extension = file.filename.split('.')[-1].lower()
    df = FileLoader.load_file(contents, file.filename)
    
    dataset_id = f"ds_{uuid.uuid4().hex[:10]}"
    
    # Store original file securely on disk with its original filename (sanitized)
    os.makedirs(STORAGE_DIR, exist_ok=True)
    safe_base_name = "".join(c for c in file.filename.rsplit('.', 1)[0] if c.isalnum() or c in (' ', '_', '-')).strip().replace(' ', '_')
    original_filename = f"{safe_base_name}_{dataset_id}.{extension}"
    original_path = os.path.join(STORAGE_DIR, original_filename)
    
    with open(original_path, "wb") as f:
        f.write(contents)
        
    DATASET_STORE[dataset_id] = df.copy(deep=True)
    
    profile_data = Profiler.profile_dataframe(df, dataset_id, file.filename, file_size, extension)
    issues = IssueDetector.detect_issues(df)
    recommendations = RecommendationEngine.generate_recommendations(issues)
    
    risk_summary = {"Low": 0, "Medium": 0, "High": 0}
    for rec in recommendations:
        lvl = rec["risk_level"]
        if lvl in risk_summary:
            risk_summary[lvl] += 1
            
    profile_data["issue_count"] = len(recommendations)
    profile_data["risk_summary"] = risk_summary
    profile_data["profiling_status"] = "complete"
    
    PROFILE_STORE[dataset_id] = profile_data
    RECOMMENDATION_STORE[dataset_id] = recommendations
    
    # Persist to SQLite
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO datasets (
                dataset_id, filename, file_size, extension, row_count, column_count,
                original_path, profile_json, recommendations_json, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            dataset_id, file.filename, file_size, extension, len(df), len(df.columns),
            original_path, json.dumps(profile_data), json.dumps(recommendations), "active"
        ))
        conn.commit()
        conn.close()
    except Exception as e:
        pass
    
    return profile_data

@router.get("/{dataset_id}/profile")
async def get_dataset_profile(dataset_id: str):
    if dataset_id not in PROFILE_STORE:
        df = load_dataset_from_db_if_needed(dataset_id)
        if df is None or dataset_id not in PROFILE_STORE:
            raise HTTPException(status_code=404, detail="Dataset profile not found.")
    return PROFILE_STORE[dataset_id]

@router.get("/{dataset_id}/recommendations")
async def get_dataset_recommendations(dataset_id: str):
    if dataset_id not in RECOMMENDATION_STORE:
        df = load_dataset_from_db_if_needed(dataset_id)
        if df is None or dataset_id not in RECOMMENDATION_STORE:
            raise HTTPException(status_code=404, detail="Recommendations not found.")
    return RECOMMENDATION_STORE[dataset_id]
