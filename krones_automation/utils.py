def get_month_folder(date_str: str) -> tuple[str, str]:
    """
    Extracts month folder from date (e.g., 28.08.2026 -> Aug-2026, 28Aug2026).
    Expected input format: DD.MM.YYYY
    """
    if not date_str:
        return "Unknown-Month", "Unknown-Date"

    parts = date_str.split('.')
    if len(parts) == 3:
        day, month, year = parts
        months = {
            "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
            "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
            "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec"
        }
        month_str = months.get(month, month)
        return f"{month_str}-{year}", f"{day}{month_str}{year}"
    return "Unknown-Month", date_str
