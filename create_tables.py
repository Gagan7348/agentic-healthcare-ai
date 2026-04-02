import pymongo
try:
    client = pymongo.MongoClient('mongodb://localhost:27017/')
    db = client['healthcare_db']
    
    # Clean up any existing views/collections
    db.patients_critical.drop()
    db.patients_monitoring.drop()
    db.patients_optimal.drop()
    
    crit = list(db.patients.find({"glucose": {"$gt": 140}}))
    if crit: db.patients_critical.insert_many(crit)
    
    mon = list(db.patients.find({"glucose": {"$gte": 100, "$lte": 140}}))
    if mon: db.patients_monitoring.insert_many(mon)
    
    opt = list(db.patients.find({"glucose": {"$lt": 100}}))
    if opt: db.patients_optimal.insert_many(opt)
    
    print('Separate collections created successfully!')
except Exception as e:
    print('Error:', e)
