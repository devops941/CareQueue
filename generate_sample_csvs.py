import os
import random
from datetime import datetime, timedelta

os.makedirs('sample_datasets', exist_ok=True)

# -------------------------------------------------------------
# File 1: Standard Weekday Baseline (25 Patients, Smooth Flow)
# -------------------------------------------------------------
base_date1 = datetime(2026, 11, 10)
depts1 = ['General Medicine', 'Pediatrics', 'Cardiology', 'Orthopedics']
types1 = ['walk_in', 'follow_up', 'new', 'walk_in']

rows1 = ['patient_token,visit_date,department_id,arrival_time,registration_time,called_time,service_start_time,service_end_time,departure_time,visit_type']
curr1 = base_date1.replace(hour=8, minute=30, second=0)

for i in range(1, 26):
    arr = curr1 + timedelta(minutes=random.randint(5, 18))
    curr1 = arr
    reg = arr + timedelta(minutes=random.randint(2, 5))
    wait = random.randint(7, 20)
    called = reg + timedelta(minutes=wait)
    s_start = called + timedelta(minutes=1)
    dur = random.randint(10, 22)
    s_end = s_start + timedelta(minutes=dur)
    dep = s_end + timedelta(minutes=random.randint(2, 5))
    
    token = f'CQ-1{i:02d}'
    dept = random.choice(depts1)
    vtype = random.choice(types1)
    
    rows1.append(
        f"{token},{arr.date()},{dept},{arr.strftime('%Y-%m-%d %H:%M:%S')},"
        f"{reg.strftime('%Y-%m-%d %H:%M:%S')},{called.strftime('%Y-%m-%d %H:%M:%S')},"
        f"{s_start.strftime('%Y-%m-%d %H:%M:%S')},{s_end.strftime('%Y-%m-%d %H:%M:%S')},"
        f"{dep.strftime('%Y-%m-%d %H:%M:%S')},{vtype}"
    )

with open('sample_datasets/1_standard_weekday_baseline.csv', 'w') as f:
    f.write('\n'.join(rows1))
print('Created sample_datasets/1_standard_weekday_baseline.csv (25 rows)')

# -------------------------------------------------------------
# File 2: Monday Morning Congestion Surge (35 Patients, Peak Delays)
# -------------------------------------------------------------
base_date2 = datetime(2026, 11, 16) # Monday
depts2 = ['General Medicine', 'General Medicine', 'Pediatrics', 'Cardiology']
types2 = ['walk_in', 'new', 'walk_in', 'emergency']

rows2 = ['patient_token,visit_date,department_id,arrival_time,registration_time,called_time,service_start_time,service_end_time,departure_time,visit_type']
curr2 = base_date2.replace(hour=8, minute=15, second=0)

for i in range(1, 36):
    # Clustered arrivals between 9:30 and 11:30
    if 10 <= i <= 28:
        arr = curr2 + timedelta(minutes=random.randint(2, 6))
        wait = random.randint(32, 58) # Congested wait
    else:
        arr = curr2 + timedelta(minutes=random.randint(8, 15))
        wait = random.randint(14, 25)
    curr2 = arr
    reg = arr + timedelta(minutes=random.randint(4, 9))
    called = reg + timedelta(minutes=wait)
    s_start = called + timedelta(minutes=1)
    dur = random.randint(12, 25)
    s_end = s_start + timedelta(minutes=dur)
    dep = s_end + timedelta(minutes=random.randint(3, 7))
    
    token = f'CQ-2{i:02d}'
    dept = random.choice(depts2)
    vtype = random.choice(types2)
    
    rows2.append(
        f"{token},{arr.date()},{dept},{arr.strftime('%Y-%m-%d %H:%M:%S')},"
        f"{reg.strftime('%Y-%m-%d %H:%M:%S')},{called.strftime('%Y-%m-%d %H:%M:%S')},"
        f"{s_start.strftime('%Y-%m-%d %H:%M:%S')},{s_end.strftime('%Y-%m-%d %H:%M:%S')},"
        f"{dep.strftime('%Y-%m-%d %H:%M:%S')},{vtype}"
    )

with open('sample_datasets/2_monday_morning_congestion_surge.csv', 'w') as f:
    f.write('\n'.join(rows2))
print('Created sample_datasets/2_monday_morning_congestion_surge.csv (35 rows)')

# -------------------------------------------------------------
# File 3: Multi-Specialty Diverse Intake (30 Patients, Mixed Triage)
# -------------------------------------------------------------
base_date3 = datetime(2026, 11, 14)
depts3 = ['General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Dermatology']
types3 = ['emergency', 'follow_up', 'walk_in', 'new', 'follow_up']

rows3 = ['patient_token,visit_date,department_id,arrival_time,registration_time,called_time,service_start_time,service_end_time,departure_time,visit_type']
curr3 = base_date3.replace(hour=9, minute=0, second=0)

for i in range(1, 31):
    arr = curr3 + timedelta(minutes=random.randint(4, 15))
    curr3 = arr
    vtype = random.choice(types3)
    
    if vtype == 'emergency':
        reg = arr + timedelta(minutes=1)
        wait = random.randint(2, 6) # Fast-track
        dur = random.randint(25, 40)
    else:
        reg = arr + timedelta(minutes=random.randint(3, 7))
        wait = random.randint(12, 35)
        dur = random.randint(8, 20)
        
    called = reg + timedelta(minutes=wait)
    s_start = called + timedelta(minutes=1)
    s_end = s_start + timedelta(minutes=dur)
    dep = s_end + timedelta(minutes=random.randint(2, 6))
    
    token = f'CQ-3{i:02d}'
    dept = random.choice(depts3)
    
    rows3.append(
        f"{token},{arr.date()},{dept},{arr.strftime('%Y-%m-%d %H:%M:%S')},"
        f"{reg.strftime('%Y-%m-%d %H:%M:%S')},{called.strftime('%Y-%m-%d %H:%M:%S')},"
        f"{s_start.strftime('%Y-%m-%d %H:%M:%S')},{s_end.strftime('%Y-%m-%d %H:%M:%S')},"
        f"{dep.strftime('%Y-%m-%d %H:%M:%S')},{vtype}"
    )

with open('sample_datasets/3_multispecialty_weekend_intake.csv', 'w') as f:
    f.write('\n'.join(rows3))
print('Created sample_datasets/3_multispecialty_weekend_intake.csv (30 rows)')
