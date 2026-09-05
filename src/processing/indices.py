def calculate_ndvi(image):
    return image.normalizedDifference(
        ["B8", "B4"]
    ).rename("NDVI")


def calculate_ndwi(image):
    return image.normalizedDifference(
        ["B8", "B11"]
    ).rename("NDWI")


def calculate_evi(image):
    return image.expression(
        "2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))",
        {
            "NIR": image.select("B8"),
            "RED": image.select("B4"),
            "BLUE": image.select("B2")
        }
    ).rename("EVI")
