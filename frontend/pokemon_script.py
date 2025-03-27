import os
import pymongo
import gridfs
from bson import ObjectId
from collections import defaultdict

# Connect to MongoDB with the required credentials
client = pymongo.MongoClient("mongodb://admin:admin@localhost:27017/PokeMap?authSource=admin")
db = client["PokeMap"]

# Initialize GridFS
fs = gridfs.GridFS(db, collection="images")

# Get collections
pokedex_collection = db["PokemonStats"]
sightings_collection = db["PokemonSightings"]
merged_collection = db["MergedPokemonSightings"]

# Delete all files from GridFS (bulk delete)
print("Deleting all images from GridFS...")
db.images.files.delete_many({})
db.images.chunks.delete_many({})

# Delete existing collections before inserting new data
print("Deleting existing collections...")
db["PokemonImages"].drop()
db["MergedPokemonSightings"].drop()

# Fetch the Pokedex data and store it in an object, indexed by Pokémon ID
print("Loading Pokedex Data...")
pokedex = {}
for row in pokedex_collection.find():
    pokemon_id = str(row["No"]).strip()  # Pokémon ID
    pokedex[pokemon_id] = {
        "name": row["Name"],
        "hp": int(row["HP"]),
        "attack": int(row["Att"]),
        "defense": int(row["Def"]),
        "special_attack": int(row["S"]["Att"]),
        "special_defense": int(row["S"]["Def"]),
        "speed": int(row["Spd"]),
        "primary_type": row["PrimaryType"],
        "secondary_type": row["SecondaryType"] or None,
        "ability1": row["Ability1"],
        "ability2": row["Ability2"] or None,
        "hidden_ability": row["HiddenAbility"] or None,
        "generation": int(row["Generation"]),
        "height": float(row["Height (m)"]),
        "weight": float(row["Weight (kg)"]),
        "capture_rate": int(row["Capture Rate"]),
        "legendary": row["overall_legendary"] == "1",
        "pokemonId": pokemon_id
    }

# Print the total number of Pokémon in the Pokedex
print(f"Loaded {len(pokedex)} Pokémon entries.")

# Preload image paths into a set for faster lookups
image_folder = "images"
image_files = set(os.listdir(image_folder))

# Group sightings by Pokémon ID
print("Grouping Pokémon sightings by Pokémon ID...")
sightings_by_pokemon = defaultdict(list)
for row in sightings_collection.find():
    pokemon_id = str(row["class"]).strip()  # Pokémon ID from sightings
    if pokemon_id in pokedex:
        sighting = {
            "location": {
                "type": "Point",
                "coordinates": [float(row["longitude"]), float(row["latitude"])]
            },
            "date": row["appearedLocalTime"]  # Use appearedLocalTime from the document
        }
        sightings_by_pokemon[pokemon_id].append(sighting)

# Create merged data with one document per Pokémon
merged_data = []
non_matching_ids = []
batch_size = 2000
batch = []

print("Merging Pokémon data with sightings...")
for pokemon_id, sightings in sightings_by_pokemon.items():
    if pokemon_id in pokedex:
        # Fetch image from local images folder and store it in GridFS
        image_path = os.path.join(image_folder, f"{pokemon_id}.png")

        # Check if the image exists in the folder
        if f"{pokemon_id}.png" in image_files:
            # Check if the image already exists in GridFS
            existing_image = db.images.files.find_one({"metadata.pokemon_id": pokemon_id})
            if not existing_image:
                # If the image doesn't exist, store it in GridFS
                with open(image_path, "rb") as image_file:
                    file_id = fs.put(image_file, filename=f"{pokemon_id}.png", metadata={"pokemon_id": pokemon_id})
            else:
                file_id = existing_image["_id"]
        else:
            print(f"Image not found for Pokémon ID {pokemon_id}")
            file_id = None

        # Create merged entry
        merged_entry = {
            "pokemon": pokedex[pokemon_id],
            "sightings": sightings,
            "comments": [],  # Initialize empty comments array
            "image_path": file_id
        }

        # Add the merged entry to the batch
        batch.append(merged_entry)
        merged_data.append(merged_entry)
    else:
        non_matching_ids.append(pokemon_id)

    # If the batch reaches the specified batch_size, insert it into MongoDB and clear the batch
    if len(batch) >= batch_size:
        print(f"Inserting batch of {len(batch)} merged Pokémon documents...")
        merged_collection.insert_many(batch)
        batch.clear()

# Insert any remaining records after the loop finishes
if batch:
    print(f"Inserting remaining batch of {len(batch)} merged Pokémon documents...")
    merged_collection.insert_many(batch)

# Ensure 2dsphere index exists on the 'sightings.location' field
print("Ensuring 2dsphere index exists on 'sightings.location' field...")
merged_collection.create_index([("sightings.location", pymongo.GEOSPHERE)])

# Print the total number of merged Pokémon documents
print(f"Total number of merged Pokémon documents: {len(merged_data)}")
print(f"Total number of sightings processed: {sum(len(entry['sightings']) for entry in merged_data)}")
print(f"Non-matching Pokémon IDs from PokemonSightings: {non_matching_ids}")

print("Script completed successfully.")
