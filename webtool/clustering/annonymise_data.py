import json

def anonymize_narratives(data):
    tag_map = {}   # maps original tag names -> anonymized tag_x
    narrative_map = {}  # maps original narrative name -> anonymized narrative_x
    tag_counter = 1
    narrative_counter = 1
    anonymized = {}

    for entry in data:
        # Map narrative name
        if entry["name"] not in narrative_map:
            narrative_map[entry["name"]] = f"narrative_{narrative_counter}"
            narrative_counter += 1
        narrative_id = narrative_map[entry["name"]]

        # Initialize the narrative entry
        anonymized[narrative_id] = {}

        for tag in entry.get("tags", []):
            tag_name = tag["name"]

            # Map tag name
            if tag_name not in tag_map:
                tag_map[tag_name] = f"tag_{tag_counter}"
                tag_counter += 1
            tag_id = tag_map[tag_name]

            # Store weight
            anonymized[narrative_id][tag_id] = tag["weight"]

    return anonymized, tag_map, narrative_map


if __name__ == "__main__":
    # Load input JSON (replace 'input.json' with your file)
    with open("clustering/efa-narratives-clean.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    anonymized, tag_map, narrative_map = anonymize_narratives(data)

    # Save anonymized output
    with open("clustering/anonymized-clean.json", "w", encoding="utf-8") as f:
        json.dump(anonymized, f, indent=2)

    # Save mappings if you want to check consistency
    with open("tag_mapping.json", "w", encoding="utf-8") as f:
        json.dump(tag_map, f, indent=2)
    with open("narrative_mapping.json", "w", encoding="utf-8") as f:
        json.dump(narrative_map, f, indent=2)

    print("Anonymization complete! Files written: anonymized.json, tag_mapping.json, narrative_mapping.json")
