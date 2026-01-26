import json
from collections import defaultdict

def find_maximal_clusters(anonymized_data, min_common_tags=2):
    # Step 1: Invert mapping -> for each tag, which narratives contain it
    tag_to_narratives = defaultdict(set)
    for narrative, tags in anonymized_data.items():
        for tag in tags:
            tag_to_narratives[tag].add(narrative)

                    # Step 2a: Handle single-tag clusters
    cluster_candidates = {}

    for tag, narratives in tag_to_narratives.items():
        if len(narratives) >= 2:  # at least 2 narratives sharing this tag
            key = frozenset(narratives)
            if key not in cluster_candidates:
                cluster_candidates[key] = {tag}
            else:
                cluster_candidates[key].add(tag)

    # Step 2b: Then handle tag pairs as before
    tags = list(tag_to_narratives.keys())
    for i in range(len(tags)):
        for j in range(i + 1, len(tags)):
            t1, t2 = tags[i], tags[j]
            narratives = tag_to_narratives[t1] & tag_to_narratives[t2]

            if len(narratives) >= 2:
                key = frozenset(narratives)
                if key not in cluster_candidates:
                    cluster_candidates[key] = {t1, t2}
                else:
                    cluster_candidates[key].update([t1, t2])


    # Step 3: Build clusters with exact intersections
    clusters = []
    seen = []

    for narratives, _ in cluster_candidates.items():
        # Compute exact intersection of tags
        common = set(anonymized_data[next(iter(narratives))].keys())
        for n in narratives:
            common &= set(anonymized_data[n].keys())

        if len(common) >= min_common_tags:
            # Compute summed weights per tag
            tag_weights = {}
            total_weight = 0
            for tag in common:
                w = sum(anonymized_data[n][tag] for n in narratives)
                tag_weights[tag] = w
                total_weight += w

            # Calculate metrics
            avg_weight_per_tag = total_weight / len(common)
            avg_weight_per_narrative = total_weight / len(narratives)
            density = total_weight / (len(common) * len(narratives))

            cluster = {
                "narratives": sorted(list(narratives)),
                "common_tags": tag_weights,
                "total_weight": total_weight,
                "avg_weight_per_tag": round(avg_weight_per_tag, 2),
                "avg_weight_per_narrative": round(avg_weight_per_narrative, 2),
                "density": round(density, 2)
            }

            seen.append((set(narratives), set(common)))
            clusters.append(cluster)

    # Step 4: Keep only maximal clusters
    maximal_clusters = []
    for i, (n_set, t_set) in enumerate(seen):
        is_maximal = True
        for j, (n_other, t_other) in enumerate(seen):
            if i != j:
                if n_set.issubset(n_other) and t_set.issubset(t_other):
                    if len(n_other) > len(n_set) or len(t_other) > len(t_set):
                        is_maximal = False
                        break
        if is_maximal:
            maximal_clusters.append(clusters[i])

    # Step 5: Assign IDs and sort by density descending
    for idx, cluster in enumerate(maximal_clusters, 2):
        cluster["cluster_id"] = f"cluster_{idx}"

    maximal_clusters.sort(key=lambda c: c["density"], reverse=True)

    return maximal_clusters


if __name__ == "__main__":
    # Load anonymized JSON
    with open("clustering/anonymized.json", "r", encoding="utf-8") as f:
        anonymized = json.load(f)

    clusters = find_maximal_clusters(anonymized, min_common_tags=3)

    # Save to JSON
    with open("clustering/clusters.json", "w", encoding="utf-8") as f:
        json.dump(clusters, f, indent=2)

    print(f"Created {len(clusters)} maximal clusters with weights and metrics. Saved to clusters.json")
