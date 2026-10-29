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
            if extension == 'csv':
                try:
                    df = pd.read_csv(io.BytesIO(contents))
                except Exception:
                    df = pd.read_csv(io.BytesIO(contents), encoding='latin1')
            elif extension == 'xlsx':
                df = pd.read_excel(io.BytesIO(contents), engine='openpyxl')
            elif extension == 'xls':
                # .xls files can sometimes be binary BIFF (.xls via xlrd) or zipped XML (.xlsx via openpyxl)
                try:
                    df = pd.read_excel(io.BytesIO(contents), engine='xlrd')
                except Exception:
                    try:
                        df = pd.read_excel(io.BytesIO(contents), engine='openpyxl')
                    except Exception:
                        # Fallback: try parsing as CSV in case it's a tab/comma separated file with .xls extension
                        try:
                            df = pd.read_csv(io.BytesIO(contents))
                        except Exception:
                            df = pd.read_csv(io.BytesIO(contents), encoding='latin1')
            elif extension == 'json':
                df = pd.read_json(io.BytesIO(contents))
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported file format: .{extension}")
            
            if df.empty:
                raise HTTPException(status_code=400, detail="The uploaded dataset is empty.")

            if len(df) > MAX_ROWS:
                raise HTTPException(status_code=400, detail=f"Dataset row count ({len(df)}) exceeds maximum limit of {MAX_ROWS}.")

            if len(df.columns) > MAX_COLUMNS:
                raise HTTPException(status_code=400, detail=f"Dataset column count ({len(df.columns)}) exceeds maximum limit of {MAX_COLUMNS}.")
            
            return df
        except HTTPException as he:
            raise he
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")
