+++
# BASIC INFORMATION
# -----------------
# The title displayed on the menu card and detail page
title = '{{ replace .File.ContentBaseName "-" " " | title }}'

# Creation date (auto-filled by Hugo - no need to change)
date = '{{ .Date }}'

# Set to "true" to hide this cookie from the site, "false" to publish it
draft = true

# MENU DISPLAY
# ------------
# Set to "true" to show on homepage Featured Treats, "false" for menu page only
featured = false

# Controls the display order (lower numbers appear first)
# Example: weight = 1 appears before weight = 2
weight = 10

# PRICING
# -------
# Price displayed on the menu card (include dollar sign)
price = "$0.00"

# Price in cents for cart calculations (e.g., $3.50 = 350)
price_cents = 0

# DESCRIPTION
# -----------
# Short description shown on the menu card (1-2 sentences)
description = "A delicious cookie description goes here."

# IMAGES
# ------
# Menu card image filename (place image in /static/ folder)
# This is the small image shown on the menu grid
image = "cookie-placeholder.png"

# Detail page hero image filename (place image in /static/ folder)
# This is the large image shown at the top of the cookie's detail page
# If not provided, the menu card image will be used instead
hero_image = ""

# RECIPE DETAILS
# --------------
# Comma-separated list of ingredients (displayed on detail page)
ingredients = "Butter, flour, sugar, eggs, vanilla"

# TAGS
# ----
# Categories for this cookie (used for filtering/organization)
# Common tags: "classic", "chocolate", "seasonal", "signature", "bestseller", "vegan", "gluten-free"
tags = ["classic"]
+++

Write your detailed cookie description here. This content appears on the individual cookie's detail page below the hero image.

You can use **bold text** and *italics* for emphasis.

**Perfect for:** Describe when or how to enjoy this cookie.