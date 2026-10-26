import pandas as pd
import numpy as np

class Profiler:
    @staticmethod
    def profile_dataframe(df: pd.DataFrame, dataset_id: str, filename: str, file_size: int, extension: str) -> dict:
        row_count = len(df)
        column_count = len(df.columns)
        total_cells = row_count * column_count
        total_missing = int(df.isnull().sum().sum())
        missing_percentage = float((total_missing / total_cells * 100) if total_cells > 0 else 0.0)
        
        try:
            duplicate_row_count = int(df.duplicated().sum())
        except Exception:
            duplicate_row_count = 0
            
        constant_columns = []
        column_profiles = []
        
        for col in df.columns:
            series = df[col]
            non_null_count = int(series.notnull().sum())
            missing_count = int(series.isnull().sum())
            missing_pct = float((missing_count / row_count * 100) if row_count > 0 else 0.0)
            unique_count = int(series.nunique(dropna=True))
            
            if unique_count <= 1:
                constant_columns.append(str(col))
                
            inferred_type = str(series.dtype)
            min_val = None
            max_val = None
            mean_val = None
            median_val = None
            
            if pd.api.types.is_numeric_dtype(series) and non_null_count > 0:
                try:
                    min_val = float(series.min()) if not pd.isna(series.min()) else None
                    max_val = float(series.max()) if not pd.isna(series.max()) else None
                    mean_val = float(series.mean()) if not pd.isna(series.mean()) else None
                    median_val = float(series.median()) if not pd.isna(series.median()) else None
                except Exception:
                    pass
            
            sample_values = series.dropna().head(5).tolist()
            cleaned_samples = []
            for val in sample_values:
                if isinstance(val, (float, np.floating)):
                    cleaned_samples.append(float(val))
                elif isinstance(val, (int, np.integer)):
                    cleaned_samples.append(int(val))
                else:
                    cleaned_samples.append(str(val))
            
            column_profiles.append({
                "name": str(col),
                "inferred_type": inferred_type,
                "non_null_count": non_null_count,
                "missing_count": missing_count,
                "missing_percentage": missing_pct,
                "unique_count": unique_count,
                "min_val": min_val,
                "max_val": max_val,
                "mean_val": mean_val,
                "median_val": median_val,
                "sample_values": cleaned_samples,
                "detected_issue_count": 0
            })
            
        return {
            "dataset_id": dataset_id,
            "filename": filename,
            "row_count": row_count,
            "column_count": column_count,
            "file_size_bytes": file_size,
            "file_extension": extension,
            "total_missing_cells": total_missing,
            "missing_percentage": missing_percentage,
            "duplicate_row_count": duplicate_row_count,
            "constant_columns": constant_columns,
            "columns": column_profiles
        }
