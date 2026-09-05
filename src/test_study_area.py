"""Extract the three Punjab study districts from Google Earth Engine."""

import ee

ee.Initialize(project="agriculture-remote-sensing")

admin = ee.FeatureCollection("FAO/GAUL/2015/level2")

india = admin.filter(
    ee.Filter.eq("ADM0_NAME", "India")
)

punjab = india.filter(
    ee.Filter.eq("ADM1_NAME", "Punjab")
)

study_districts = punjab.filter(
    ee.Filter.inList(
        "ADM2_NAME",
        ["Amritsar", "Bathinda", "Sangrur"]
    )
)

count = study_districts.size().getInfo()

print(f"Study districts found: {count}")

names = study_districts.aggregate_array(
    "ADM2_NAME"
).getInfo()

print("\nSelected study districts:")

for name in names:
    print(f"- {name}")
