import ee
import geemap

ee.Initialize(project="agriculture-remote-sensing")

admin = ee.FeatureCollection("FAO/GAUL/2015/level2")

punjab = admin.filter(
    ee.Filter.And(
        ee.Filter.eq("ADM0_NAME", "India"),
        ee.Filter.eq("ADM1_NAME", "Punjab")
    )
)

study_districts = punjab.filter(
    ee.Filter.inList(
        "ADM2_NAME",
        ["Amritsar", "Bathinda", "Sangrur"]
    )
)

Map = geemap.Map()

Map.centerObject(study_districts, 8)

Map.addLayer(
    study_districts,
    {"color": "red"},
    "Study Districts"
)

Map.to_html("outputs/study_area_map.html")
