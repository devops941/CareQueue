import os
import random
from datetime import datetime, timedelta

os.makedirs('sample_datasets', exist_ok=True)

# ==============================================================================
# DATASET 1: For 'Import Dataset' Module (Past 30 Days Multi-Day Historical Data)
# ==============================================================================
# 50 records spread across the past 30 days to populate 24h Heatmap & Historical Trends
today = datetime(2026, 11, 18)
depts = ['General Medicine', 'Pediatrics', 'Cardiology', 'Orthopedics']
types = ['walk_in', 'follow_up', 'new', 'walk_in', 'emergency']

rows_historical = [
    'patient_token,visit_date,department_id,arrival_time,registration_time,called_time,service_start_time,service_end_time,departure_time,visit_type'
]

for i in range(1, 51):
    # Days in the past (1 to 28 days ago)
    days_ago = random.randint(1, 28)
    day_date = today - timedelta(days=days_ago)
    
    # Hour between 08:00 and 17:00
    hour = random.choice([8, 9, 9, 10, 10, 11, 11, 12, 14, 14, 15, 16])
    minute = random.randint(0, 50)
    arr = day_date.replace(hour=hour, minute=minute, second=0)
    
    reg = arr + timedelta(minutes=random.randint(2, 6))
    
    # Simulate peak hour waits (10:00 - 11:30 higher wait)
    if hour in [10, 11]:
        wait = random.randint(28, 48)
    else:
        wait = random.randint(8, 22)
        
    called = reg + timedelta(minutes=wait)
    s_start = called + timedelta(minutes=1)
    dur = random.randint(10, 24)
    s_end = s_start + timedelta(minutes=dur)
    dep = s_end + timedelta(minutes=random.randint(2, 6))
    
    token = f'CQ-HIST-{i:03d}'
    dept = random.choice(depts)
    vtype = random.choice(types)
    
    rows_historical.append(
        f"{token},{arr.date()},{dept},{arr.strftime('%Y-%m-%d %H:%M:%S')},"
        f"{reg.strftime('%Y-%m-%d %H:%M:%S')},{called.strftime('%Y-%m-%d %H:%M:%S')},"
        f"{s_start.strftime('%Y-%m-%d %H:%M:%S')},{s_end.strftime('%Y-%m-%d %H:%M:%S')},"
        f"{dep.strftime('%Y-%m-%d %H:%M:%S')},{vtype}"
    )

with open('sample_datasets/historical_dataset_for_import_module.csv', 'w') as f:
    f.write('\n'.join(rows_historical))
print('Created sample_datasets/historical_dataset_for_import_module.csv (50 historical rows)')

# ==============================================================================
# DATASET 2: For 'Visit Records' Module (Today 2026-11-18 Live Patient Intake Flow)
# ==============================================================================
# 20 records for today representing real-time reception arrivals & consult states
rows_today = [
    'patient_token,visit_date,department_id,arrival_time,registration_time,called_time,service_start_time,service_end_time,departure_time,visit_type'
]

curr_today = today.replace(hour=8, minute=15, second=0)

for i in range(1, 21):
    arr = curr_today + timedelta(minutes=random.randint(10, 25))
    curr_today = arr
    reg = arr + timedelta(minutes=random.randint(2, 5))
    
    token = f'CQ-LIVE-{i:02d}'
    dept = random.choice(depts)
    vtype = random.choice(types)
    
    # Categorize into active queue stages based on patient index:
    if i <= 8:
        # Completed Visits (Full journey logged)
        wait = random.randint(10, 25)
        called = reg + timedelta(minutes=wait)
        s_start = called + timedelta(minutes=1)
        dur = random.randint(12, 20)
        s_end = s_start + timedelta(minutes=dur)
        dep = s_end + timedelta(minutes=random.randint(2, 5))
        
        rows_today.append(
            f"{token},{arr.date()},{dept},{arr.strftime('%Y-%m-%d %H:%M:%S')},"
            f"{reg.strftime('%Y-%m-%d %H:%M:%S')},{called.strftime('%Y-%m-%d %H:%M:%S')},"
            f"{s_start.strftime('%Y-%m-%d %H:%M:%S')},{s_end.strftime('%Y-%m-%d %H:%M:%S')},"
            f"{dep.strftime('%Y-%m-%d %H:%M:%S')},{vtype}"
        )
    elif i <= 14:
        # In-Consultation Visits (Called & Doctor seeing patient right now)
        wait = random.randint(8, 20)
        called = reg + timedelta(minutes=wait)
        s_start = called + timedelta(minutes=1)
        
        rows_today.append(
            f"{token},{arr.date()},{dept},{arr.strftime('%Y-%m-%d %H:%M:%S')},"
            f"{reg.strftime('%Y-%m-%d %H:%M:%S')},{called.strftime('%Y-%m-%d %H:%M:%S')},"
            f"{s_start.strftime('%Y-%m-%d %H:%M:%S')},,,{vtype}"
        )
    else:
        # Waiting in Queue (Registered at desk, waiting to be called by doctor)
        rows_today.append(
            f"{token},{arr.date()},{dept},{arr.strftime('%Y-%m-%d %H:%M:%S')},"
            f"{reg.strftime('%Y-%m-%d %H:%M:%S')},,,,,{vtype}"
        )

with open('sample_datasets/todays_reception_for_visit_records_module.csv', 'w') as f:
    f.write('\n'.join(rows_today))
print('Created sample_datasets/todays_reception_for_visit_records_module.csv (20 live today rows)')
