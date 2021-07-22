from caller import search_for_causes, extract_cause_name
from copy import deepcopy
import os
import json

ICD_DESTINATION_FILE="../death-causes-app/src/resources/ICD.json"
TOTAL_DEATHS_DESTINATION_FILE="../death-causes-app/src/resources/totalDeaths.json"

def extract_icd_code(file_name):
    return file_name.split(os.sep)[-1].split(".")[0]

def read_and_compute_totals():
    writtenFs= search_for_causes("Causes")
    icd_to_cause={}
    cause_to_icds={}
    icd_to_total={}
    for cause_dir in writtenFs:
        files = [f for f in os.listdir(cause_dir) if f.endswith(".txt")]
        cause=extract_cause_name(cause_dir)
        cause_to_icds[cause]=[]
        for fil in files:
            with open(os.path.join(cause_dir,fil), 'r') as f:
                total=sum(map(float, f.readline().split(" ")))
                icd=extract_icd_code(fil)
                icd_to_cause[icd]=cause
                cause_to_icds[cause].append(icd)
                icd_to_total[icd]=total
    return icd_to_cause, cause_to_icds, icd_to_total

def compute_cause_to_total(cause_to_icds, icd_to_total):
    res={}
    for cause, icds in cause_to_icds.items():
        res[cause]={}
        res[cause]["total"]=0
        for icd in icds:
            res[cause]["total"]+=icd_to_total[icd]
    total_deaths=sum(res[c]["total"] for c in cause_to_icds.keys())
    for cause in cause_to_icds.keys():
        res[cause]["proportion"]=res[cause]["total"]/total_deaths
    return res

def run():
    icd_to_cause, cause_to_icds, icd_to_total = read_and_compute_totals()
    total=sum(icd_to_total.values())
    print("icd_to_cause, cause_to_icds, icd_to_total")
    print(icd_to_cause)
    print(cause_to_icds)
    print(icd_to_total)
    print("total:", total)
    cause_to_total=compute_cause_to_total(cause_to_icds, icd_to_total)
    all_icds=set(icd_to_total.keys())
    cause_to_icd_dic={}
    for cause, icds in cause_to_icds.items():
        print(cause)
        taken_keys = []
        heap = deepcopy(icds)
        heap.sort(key=len)
        sibling_groups={}
        taken_sibling_groups=[]
        icd_dic={}
        while heap:
            icd=heap[-1]
            candidate_icd=icd[:-1]
            list_of_siblings={}
            parent_possible=True
            for check_icd, check_cause in icd_to_cause.items():
                if check_icd.startswith(candidate_icd):
                    if check_cause==cause:
                        if check_icd not in taken_keys:
                            list_of_siblings[check_icd] = (check_icd,
                                                           icd_to_total[check_icd]/cause_to_total[cause]["total"],
                                                           "Childless",
                                                           {})
                            heap.remove(check_icd)
                            taken_keys.append(check_icd)
                        else:
                            continue
                    else:
                        parent_possible=False
            for sibling_group_icd, sibling_group in sibling_groups.items():
                if sibling_group_icd.startswith(candidate_icd) and sibling_group_icd not in taken_sibling_groups:
                    list_of_siblings[sibling_group_icd]=(
                        sibling_group_icd,
                        sibling_group[1],
                        "Parent",
                        sibling_group[3]
                    )
                    heap.remove(sibling_group_icd)
                    taken_sibling_groups.append(sibling_group_icd)

            if parent_possible:
                #print(list_of_siblings)
                total_for_group=sum(x for _,x,_,_ in list_of_siblings.values())
                sibling_groups[candidate_icd]=(
                    candidate_icd,
                    total_for_group,
                    True,
                    list_of_siblings
                )
                heap.append(candidate_icd)
                heap.sort(key=len)
            else:
                icd_dic.update(list_of_siblings)
        for sibling_group_icd, sibling_group in sibling_groups.items():
            if sibling_group_icd not in taken_sibling_groups:
                icd_dic[sibling_group_icd]=sibling_group
        cause_to_icd_dic[cause]=icd_dic
    print(cause_to_icd_dic["Alzheimers"])
    with open(ICD_DESTINATION_FILE, 'w') as f:
        f.write(json.dumps(cause_to_icd_dic))
    with open(TOTAL_DEATHS_DESTINATION_FILE, "w") as f:
        f.write(json.dumps(cause_to_total))







if __name__ == '__main__':
    print(run())
