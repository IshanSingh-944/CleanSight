import io
import os
import pandas as pd
from fastapi import HTTPException

MAX_UPLOAD_SIZE_MB = int(os.environ.get("MAX_UPLOAD_SIZE_MB", 50))
MAX_ROWS = int(os.environ.get("MAX_ROWS", 1000000))
MAX_COLUMNS = int(os.environ.get("MAX_COLUMNS", 500))

class FileLoader:
    @staticmethod
    def load_file(contents: bytes, filename: str) -> pd.DataFrame:
        file_size_mb = len(contents) / (1024 * 1024)
        if file_size_mb > MAX_UPLOAD_SIZE_MB:
            raise HTTPException(
                status_code=400, 
                detail=f"File size ({file_size_mb:.2f} MB) exceeds the configured limit of {MAX_UPLOAD_SIZE_MB} MB."
            )

        if not filename or '.' not in filename:
            raise HTTPException(status_code=400, detail="Invalid filename or missing file extension.")

        extension = filename.split('.')[-1].lower()
        allowed_extensions = ['csv', 'xlsx', 'xls', 'json']
        if extension not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file format '.{extension}'. Allowed formats: {allowed_extensions}"
            )

        try:
            df = None
            if extension == 'csv':
                for sep in [',', '\t', ';', '|']:
                    try:
                        df = pd.read_csv(io.BytesIO(contents), sep=sep, on_bad_lines='skip')
                        if df is not None and len(df.columns) > 1:
                            break
                    except Exception:
                        continue
                if df is None or len(df.columns) <= 1:
                    df = pd.read_csv(io.BytesIO(contents), encoding='latin1', on_bad_lines='skip')
            elif extension == 'xlsx':
                df = pd.read_excel(io.BytesIO(contents), engine='openpyxl')
            elif extension == 'xls':
                # .xls files can be binary BIFF (.xls via xlrd), zipped XML (.xlsx), HTML tables, or TSV/CSV
                for attempt_engine in ['xlrd', 'openpyxl']:
                    try:
                        df = pd.read_excel(io.BytesIO(contents), engine=attempt_engine)
                        if df is not None and not df.empty:
                            break
                    except Exception:
                        continue
                if df is None or df.empty:
                    # Try HTML table parsing (some web exports save HTML tables with .xls extension)
                    try:
                        tables = pd.read_html(io.BytesIO(contents))
                        if tables:
                            df = tables[0]
                    except Exception:
                        pass
                if df is None or df.empty:
                    # Fallback to delimited text / CSV with flexible separators
                    for sep in [',', '\t', ';', '|']:
                        try:
                            df = pd.read_csv(io.BytesIO(contents), sep=sep, on_bad_lines='skip')
                            if df is not None and len(df.columns) > 1:
                                break
                        except Exception:
                            continue
                if df is None or df.empty:
                    df = pd.read_csv(io.BytesIO(contents), encoding='latin1', on_bad_lines='skip')
            elif extension == 'json':
                df = pd.read_json(io.BytesIO(contents))
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported file format: .{extension}")
            
            if df is None or df.empty:
                raise HTTPException(status_code=400, detail="The uploaded dataset is empty or could not be parsed.")

            if len(df) > MAX_ROWS:
                raise HTTPException(status_code=400, detail=f"Dataset row count ({len(df)}) exceeds maximum limit of {MAX_ROWS}.")

            if len(df.columns) > MAX_COLUMNS:
                raise HTTPException(status_code=400, detail=f"Dataset column count ({len(df.columns)}) exceeds maximum limit of {MAX_COLUMNS}.")
            
            return df
        except HTTPException as he:
            raise he
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")
