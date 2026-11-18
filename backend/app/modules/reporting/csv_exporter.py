import csv
import io

def analytics_to_csv(result: dict) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    source = result.get("source", "historical").upper()
    writer.writerow([f"SOURCE: {source} DATA"])
    writer.writerow(["Generated at", result.get("generated_at", "")])
    writer.writerow([])

    summary = result.get("summary", {})
    writer.writerow(["SUMMARY STATISTICS"])
    writer.writerow(["Metric", "Value"])
    for k, v in summary.items():
        writer.writerow([k, v])
    writer.writerow([])

    breakdown = result.get("breakdown", [])
    if breakdown:
        writer.writerow(["BREAKDOWN"])
        if breakdown:
            keys = ["group_label", "count"] + list(breakdown[0].get("stats", {}).keys())
            writer.writerow(keys)
            for b in breakdown:
                row = [b.get("group_label",""), b.get("count","")]
                for k in list(breakdown[0].get("stats",{}).keys()):
                    row.append(b.get("stats",{}).get(k,""))
                writer.writerow(row)

    return output.getvalue()

def visits_to_csv(visits: list) -> str:
    if not visits:
        return "No data\n"
    output = io.StringIO()
    keys = ["patient_token","visit_date","visit_type","arrival_time","registration_time","called_time","service_start_time","service_end_time","departure_time","queue_wait_minutes","service_time_minutes","total_visit_minutes"]
    writer = csv.DictWriter(output, fieldnames=keys, extrasaction='ignore')
    writer.writeheader()
    writer.writerows(visits)
    return output.getvalue()
