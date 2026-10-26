class RiskPolicy:
    @staticmethod
    def evaluate_risk(issue_type: str, affected_percentage: float, column_name: str = "") -> str:
        col_lower = column_name.lower()
        is_critical_field = any(term in col_lower for term in ['id', 'uuid', 'key', 'target', 'label', 'price', 'salary', 'revenue', 'account'])
        
        if issue_type == 'whitespace':
            return 'Low'
        elif issue_type == 'duplicate_rows':
            return 'Medium' if affected_percentage < 5.0 else 'High'
        elif issue_type == 'missing_values':
            if is_critical_field:
                return 'High'
            return 'Medium' if affected_percentage < 20.0 else 'High'
        elif issue_type == 'constant_column':
            return 'Low'
        elif issue_type == 'outlier':
            return 'Medium' if not is_critical_field else 'High'
        elif issue_type == 'categorical_inconsistency':
            return 'Low' if affected_percentage < 10.0 else 'Medium'
        else:
            return 'Medium'
