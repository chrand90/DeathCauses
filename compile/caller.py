from frequencies import getFrequencies
from interpolation import interpolate_one, interpolate_one_spline
import factor_probabilities
import os
import time
import risk_ratios as rr
import json
from data_frame import initialize_data_frame_by_columns
from generate_color import make_hex_color
from count_descendants import count_descendants, compute_forward_relations, compute_optimizability

from age_numbers import get_age_distribution, get_age_totals  # to adjust the risk ratio to the age intervals

DEATHCAUSE_CATEGORY = "Death cause category"
DEATHCAUSE = "Death cause"
FACTORQUESTIONS_RAW_FILE = "../death-causes-app/src/resources/FactorDatabaseRaw.json"
FACTORQUESTIONS_COMPILED_FILE = "../death-causes-app/src/resources/FactorDatabase.json"
COMPUTED_FACTORS_FILE = "../death-causes-app/src/resources/ComputedFactorsRelations.json"
DESCRIPTIONS_DESTINATION_FILE = "../death-causes-app/src/resources/Descriptions.json"
RELATIONFILE_DESTINATION = "../death-causes-app/src/resources/Relations.json"
CAUSES_DESTIONATION_FILE="../death-causes-app/src/resources/Causes.json"
CATEGORY_CAUSES_DESTIONATION_FILE="../death-causes-app/src/resources/CategoryCauses.json"
CONDITIONS_DESTINATION="../death-causes-app/src/resources/Conditions.json"


def remove_duplicates_and_Age(listi):
    if "Age" in listi:
        listi.remove("Age")
    return list(set(listi))


def combine_relations(relations, descriptions):
    with open(FACTORQUESTIONS_RAW_FILE, "r") as f:
        factors = json.load(f)
    for factor_info in factors:
        relations[factor_info["factorname"]] = {
            "type": "Input factor",
            "ancestors": []}
        descriptions[factor_info["factorname"]]={
            "optimizability": factor_info["optimizability"],
            "descriptions": factor_info["descriptions"],
            "baseUnit":factor_info["baseUnit"]}
    with open(COMPUTED_FACTORS_FILE, 'r') as f:
        computed_factors = json.load(f)
    for factorName, factor_info in computed_factors.items():
        relations[factorName] = {
            "ancestors": factor_info["ancestors"],
            "type" : "Computed factor"
        }
    for factorName, factor_info in computed_factors.items():
        descriptions[factorName]= {
            "optimizability": compute_optimizability(relations, factorName, descriptions),
            "descriptions": factor_info["descriptions"],
            "baseUnit": factor_info["baseUnit"]
        }
    for node_name, node in descriptions.items():
        descriptions[node_name]["color"]=make_hex_color(node_name)
    factors_compiled=compiled_factors(relations, factors)
    return relations, descriptions, factors_compiled

def compiled_factors(relations, factors):
    factors_compiled = []
    forward_relations=compute_forward_relations(relations)
    for factor_info in factors:
        del factor_info["descriptions"]
        del factor_info["baseUnit"]
        descendants= factor_info["descendants"]=count_descendants(forward_relations, factor_info["factorname"])
        factor_info["descendants"]=descendants
        factors_compiled.append(factor_info)
    return factors_compiled


def integrate_and_interpolate_one(rr_dir, age_intervals, age_distribution, Ages):
    if rr_dir.split(os.sep)[-1]=="rr_BMI-HCVStatus":
        print("debug location")
    riskfactorgroup = {}
    normalizers, RRs, string_interaction_name = integrate_one(rr_dir, age_intervals, age_distribution)

    normalizer_age_object = initialize_data_frame_by_columns(Age=Ages, values_list=normalizers)
    #print('normalizer age object -----------------------------------------------------')
    #print(normalizer_age_object)
    riskfactorgroup['normalisingFactors'] = normalizer_age_object.get_as_standard_age_prevalences()
    riskfactorgroup['interactionFunction'] = string_interaction_name
    riskratiotables = []
    riskfactor_names = []



    for RR in RRs:
        RRlist = RR.get_as_list_of_lists_with_freqs()
        factor_names = RR.get_FactorNames()
        interpolated_RR = interpolate_one_spline(RR).as_json()
        riskratiotable = {'riskRatioTable': RRlist,
                          'riskFactorNames': factor_names,
                          'interpolationTable': interpolated_RR}
        riskratiotables.append(riskratiotable)
        riskfactor_names.extend(factor_names)
    riskfactorgroup['riskRatioTables'] = riskratiotables
    return riskfactorgroup, remove_duplicates_and_Age(riskfactor_names)

def add_all_special_factors(age_intervals, folder, death_causes, relations):
    special_factor_dirs = search_for_riskfactors(folder, prefix="special_factor_")
    for disease, dirs in special_factor_dirs.items():
        for speical_factor_dir in dirs:
            RRs = rr.loadRRs(speical_factor_dir)
            attach_freqs_to_rr(RRs)
            riskratiotables=[]
            riskfactor_names=[]
            for RR in RRs:
                RRlist = RR.get_as_list_of_lists_with_freqs()
                factor_names = RR.get_FactorNames()
                riskratiotable = {'riskRatioTable': RRlist,
                                  'riskFactorNames': factor_names}
                riskratiotables.append(riskratiotable)
                riskfactor_names.extend(factor_names)

            if "SpecialFactorGroups" not in death_causes[disease]:
                death_causes[disease]["SpecialFactorGroups"]=[]
            death_causes[disease]["SpecialFactorGroups"].append(riskratiotables)
            relations[disease]["ancestors"].extend(riskfactor_names)



def integrate_and_interpolate_all(age_intervals, folder):
    '''
    input: age_intervals: list of tuples of intervals with start and end. 
    '''

    relations = get_cause_hierarchy(folder)
    cause_dirs = search_for_causes(folder)
    rr_dirs = search_for_riskfactors(folder)
    descriptions = search_for_descriptions(folder)

    # for disease, d_dic in relations.items():
    #     print(disease, ": ", d_dic["type"])

    age_distribution = get_age_distribution()

    Ages = age_distribution.get_col("Age")

    death_causes = {}
    death_cause_categories = {}
    for cause_dir in cause_dirs:
        cause_name = extract_cause_name(cause_dir)
        frequencies = getFrequencies(cause_dir + os.sep)  # , total_population)
        death_causes[cause_name] = {'Age': frequencies.get_as_standard_age_prevalences(),
                                    'RiskFactorGroups': []}

    for disease, d_dic in relations.items():
        if d_dic['type'] == DEATHCAUSE_CATEGORY:
            death_cause_categories[disease] = {'RiskFactorGroups': []}

    for disease, rr_dirs in rr_dirs.items():
        for rr_dir in rr_dirs:
            #print(rr_dir)
            rr_norm, riskfactor_names = integrate_and_interpolate_one(rr_dir, age_intervals, age_distribution, Ages)
            relations[disease]["ancestors"].extend(riskfactor_names)
            if disease in death_causes:
                death_causes[disease]["RiskFactorGroups"].append(rr_norm)
            else:
                death_cause_categories[disease]['RiskFactorGroups'].append(rr_norm)

    return relations, descriptions, death_causes, death_cause_categories


def extract_cause_name(ICD_dir):
    return ICD_dir.split(os.sep)[-2]


def replace_cause_with_condition(relations):
    for nodeName in relations.keys():
        if relations[nodeName]["type"] == "Death cause":
            relations[nodeName]["type"] = "Condition"
    return relations

def set_optimizability_for_conditions(descriptions):
    for nodeName, node in descriptions.items():
        descriptions[nodeName]["optimizability"] = 50

def run(age_intervals=None):
    if age_intervals is None:
        age_intervals = get_age_totals()[0]
    relations_conditions, descriptions_conditions, conditions, _ = integrate_and_interpolate_all(age_intervals,
                                                                                                 "Conditions")
    set_optimizability_for_conditions(descriptions_conditions)
    add_all_special_factors(age_intervals,"Conditions",conditions, relations_conditions)
    relations_conditions= replace_cause_with_condition(relations_conditions)
    relations, descriptions, death_causes, death_cause_categories = integrate_and_interpolate_all(age_intervals, "Causes")
    relations.update(relations_conditions)
    print("all relations")
    for k,v in relations.items():
        print(k,":", v)
    descriptions.update(descriptions_conditions)
    compiled_relations, compiled_descriptions, compiled_factors = combine_relations(relations, descriptions)
    transform_to_json(conditions, CONDITIONS_DESTINATION)
    transform_to_json(compiled_relations, RELATIONFILE_DESTINATION)
    transform_to_json(compiled_descriptions, DESCRIPTIONS_DESTINATION_FILE)
    transform_to_json(compiled_factors, FACTORQUESTIONS_COMPILED_FILE)
    transform_to_json(death_causes, CAUSES_DESTIONATION_FILE)
    transform_to_json(death_cause_categories, CATEGORY_CAUSES_DESTIONATION_FILE)
    # transform_to_json(integrate_all_in_folder(age_intervals, "Indirect_Causes"), "Indirect_causes_for_json")


def transform_to_json(inp, filename):
    # print inp
    with open(filename, 'w') as f:
        f.write(json.dumps(inp, default=lambda formula: str(formula)))

def attach_freqs_to_rr(RRs):
    for RRpart in RRs:
        if not "Age" in RRpart.get_FactorNames():
            freqs=factor_probabilities.get_factor_probabilities_for_one_age_interval(
                RRpart.get_categories(RRpart.get_FactorNames()),
                "0,90"
            )
        else:
            age_values=RRpart.get_categories(["Age"])["Age"]
            freqs=factor_probabilities.get_factor_probabilities_for_one_age_interval(
                RRpart.get_categories(RRpart.get_FactorNames()),
                age_values[0]
            )
            freqs.insert_column("Age", [age_values[0]]*len(freqs))
            for i in range(1,len(age_values)):
                extra_freqs=factor_probabilities.get_factor_probabilities_for_one_age_interval(
                    RRpart.get_categories(RRpart.get_FactorNames()),
                    age_values[i]
                )
                extra_freqs.insert_column("Age",[age_values[i]]*len(extra_freqs))
                freqs.join(extra_freqs)
        RRpart.set_freqs(freqs)

def integrate_one(writtenF_dir, age_intervals, age_distribution):
    '''
        input: writtenF_dir: a string directory to the folder of risk ratio files. 
               age_intervals: a list of list/tuples of numbers that give the age intervals to integrate separately.
        output: a list of normalizing constants. 
    '''
    RRs = rr.loadRRs(writtenF_dir)
    interaction, string_interaction_name = rr.read_interaction(writtenF_dir)
    RR = rr.make_simultane_and_get_writtenF(RRs, interaction)
    RRages = [factor_probabilities.adjust_to_age_group(RR, age_interval, age_distribution) for age_interval in
              age_intervals]
    folder=writtenF_dir.split(os.sep)[-1]
    disease = writtenF_dir.split(os.sep)[-2]
    print("Integrating: "+ folder)
    factor_prob_data_frames = factor_probabilities.get_factor_probabilities(RR.get_categories(RR.get_FactorNames()),
                                                                            age_intervals)
    attach_freqs_to_rr(RRs)
    normalizers = []

    for RRage, factor_prob_data_frame in zip(RRages, factor_prob_data_frames):
        # print factor_prob_data_frame
        # print  RRage
        combined_df = factor_prob_data_frame * RRage
        normalizers.append(combined_df.sum())

    # RRs_as_dictionaries=[RR.getDataframeAsDictionary(RR.factornames) for RR in RRs]

    return normalizers, RRs, string_interaction_name


def create_normalizer_file(writtenF_dir, nums):
    '''
    input: writtenF_dir: string directory of the position of the riskratio files for which nums are the normalizers. 
    '''
    with open(writtenF_dir + "normalizer.txt", 'w') as f:
        for num in nums:
            f.write(str(num) + "\t")


def getAllCategories(listOfDataframes):
    '''
    Input: list of dataframes [df1,df2,...]
    Output: Dictionary {factor1:[factor categories for factor1], ...}
    Note that all dataframes are adjusted to RR categories before this function is called,
    thus it doesn't matter which dataframe is used to get the categories for a given factor. 
    '''
    factorDic = {}
    for df in listOfDataframes:
        factorDic.update(df.get_categories(df.get_FactorNames()))
    return factorDic


# def similarize_rrs(rrs):
#     return rrs

def search_for_descriptions(folder):
    descriptions = {}
    list_of_files = os.walk(os.path.join(os.pardir, "Database", folder))
    for path, dirs_within, files_within in list_of_files:
        name = path.split(os.sep)[-1]
        if not len(dirs_within) == 0:
            if "descriptions.json" in files_within:
                with open(os.path.join(path, "descriptions.json")) as f:
                    descriptions[name]={"descriptions":json.load(f)}
            else:
                descriptions[name]={"descriptions":[name]}
    if "Causes" in descriptions:
        del descriptions["Causes"]
    return descriptions

def search_for_causes(folder):
    cause_dirs = []
    list_of_files = os.walk(os.path.join(os.pardir, "Database", folder))
    for path, dirs_within, _ in list_of_files:

        if "ICDfiles" in dirs_within:
            cause_dirs.append(path + os.sep + "ICDfiles")
    return cause_dirs


def search_for_riskfactors(folder, prefix="rr_"):
    rr_dirs = {}
    list_of_files = os.walk(os.path.join(os.pardir, "Database", folder))
    for path, dirs_within, _ in list_of_files:
        for potential_rr in dirs_within:
            if potential_rr.startswith(prefix):
                disease = path.split(os.sep)[-1]
                if disease in rr_dirs:
                    rr_dirs[disease].append(os.path.join(path, potential_rr))
                else:
                    rr_dirs[disease] = [os.path.join(path, potential_rr)]
    return rr_dirs


def search_for_writtenF_directories(folder):
    writtenF_dirs = []
    list_of_files = os.walk(os.path.join(os.pardir, "Database", folder))
    for path, dirs_within, _ in list_of_files:
        if "ICDfiles" in dirs_within:
            rr_dirs = [path + os.sep + direc for direc in dirs_within if direc.startswith('rr_')]
            writtenF_dirs.append((path + os.sep + "ICDfiles", rr_dirs))
    return writtenF_dirs


def get_ancestor_chain(path, stop_string):
    ad = path.split(stop_string)[1]
    chain = ad.split(os.sep)
    return (chain)


def get_cause_hierarchy(folder):
    parents = {}
    start_folder = os.path.join(os.pardir, "Database", folder)
    list_of_files = os.walk(start_folder)
    for path, dirs_within, _ in list_of_files:
        if "ICDfiles" in dirs_within:
            ch = get_ancestor_chain(path, start_folder)
            if len(ch) > 1:
                for index, (child, ancestor) in enumerate(zip(ch[1:][::-1], ch[:-1][::-1])):
                    if index == 0:  # this means we are dealing with a death cause end note
                        if ancestor:
                            parents[child] = {"type": DEATHCAUSE, "ancestors": [ancestor]}
                        else:
                            parents[child] = {"type": DEATHCAUSE, "ancestors": []}

                    else:
                        if child not in parents:
                            parents[child] = {"type": DEATHCAUSE_CATEGORY, "ancestors": []}
                            if ancestor:
                                parents[child]["ancestors"].append(ancestor)
    return parents


if __name__ == "__main__":
    # get_cause_hierarchy("Causes")
    # start_folder = os.path.join(os.pardir, "Database", "Causes")
    # list_of_files = os.walk(start_folder)
    # for path, dirs_within, _ in list_of_files:
    #     if "ICDfiles" in dirs_within:
    #         print(get_ancestor_chain(path, start_folder))
    # import sys
    # sys.exit()
    start = time.time()
    # print([f for f in os.walk(os.path.join(os.pardir, "Database", 'Causes'))])
    # print(get_cause_hierarchy('Causes'))
    alist = search_for_writtenF_directories("Causes")
    # print alist
    # run()
    run()
    #     res=[]
    #     for a in alist[:2]:
    #         for df in loadRRs(a):
    #             print df
    #             res.append(df)
    #     ai=[]
    #     for i in range(0,100,10):
    #         ai.append((i,i+10))
    #     integrate_all(ai)

    # make_simultane_and_get_writtenF(res,multiplicative(1,2))
    end = time.time()
    print(end - start)
