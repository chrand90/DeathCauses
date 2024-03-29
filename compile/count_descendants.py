def compute_forward_relations(relations):
    forward_relations={}
    types={}
    for nodeName, node_info in relations.items():
        types[nodeName]=node_info["type"]
        for ancestor in node_info["ancestors"]:
            if ancestor in forward_relations:
                forward_relations[ancestor]["descendants"].append(nodeName)
            else:
                forward_relations[ancestor]={"descendants":[nodeName]}
    for nodeName, typeVal in types.items():
        if nodeName in forward_relations:
            forward_relations[nodeName]["type"]=typeVal
        else:
            forward_relations[nodeName]={
                "type":typeVal,
                "descendants":[]
            }
    return forward_relations

def count_descendants(forward_relations, nodeName):
    t=forward_relations[nodeName]["type"]
    if t=="Death cause" or t=="Death cause category":
        return [nodeName]
    descendants=forward_relations[nodeName]["descendants"]
    list_of_descendants=[count_descendants(forward_relations, descendant ) for descendant in descendants]
    possibly_with_duplicates=[m for d_descendants in list_of_descendants for m in d_descendants]
    return list(set(possibly_with_duplicates))

def compute_optimizability(relations, nodeName, factors):
    if "optimizability" in factors[nodeName]:
        return factors[nodeName]["optimizability"]
    ancestors = relations[nodeName]["ancestors"]
    optimizability_candidates=[]
    for ancestor in ancestors:
        perhaps_candidate=compute_optimizability(relations, ancestor, factors)
        if isinstance(perhaps_candidate, dict):
            optimizability_candidates.append(perhaps_candidate["default"])
        else:
            optimizability_candidates.append(perhaps_candidate)
    return max(optimizability_candidates)


if __name__=="__main__":
    relations= {
        "BMI":{
            "ancestors":["Height","Weight"],
            "type":"Computed factor"
        },
        "Height":{
            "ancestors":[],
            "type":"Input factor"
        },
        "Weight":{
            "ancestors":[],
            "type":"Input factor"
        },
        "Diabetes":{
            "ancestors":["BMI", "Waist"],
            "type":"Death cause"
        },
        "Waist":{
            "ancestors":[],
            "type":"Input factor"
        },
        "LiverCancer":{
            "ancestors":["BMI"],
            "type":"Death cause"
        }
    }
    forward_relations=compute_forward_relations(relations)
    print(forward_relations)
    for key in forward_relations:
        print(key+":",count_descendants(forward_relations,key))