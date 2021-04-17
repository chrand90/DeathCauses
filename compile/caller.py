from frequencies import getFrequencies
from interpolation import interpolate_one, interpolate_one_spline
import factor_probabilities
import os
import time
import risk_ratios as rr
import json
from data_frame import initialize_data_frame_by_columns
from generate_color import make_hex_color

from age_numbers import get_age_distribution, get_age_totals  # to adjust the risk ratio to the age intervals

DEATHCAUSE_CATEGORY = "Death cause category"
DEATHCAUSE = "Death cause"
FACTORQUESTIONS_FILE = "../death-causes-app/src/resources/FactorDatabase.json"
COMPUTED_FACTORS_FILE = "../death-causes-app/src/resources/ComputedFactorsRelations.json"
RELATIONFILE_DESTINATION = "../death-causes-app/src/resources/Relations.json"
CAUSES_DESTIONATION_FILE="../death-causes-app/src/resources/Causes.json"
CATEGORY_CAUSES_DESTIONATION_FILE="../death-causes-app/src/resources/CategoryCauses.json"


def remove_duplicates_and_Age(listi):
    if "Age" in listi:
        listi.remove("Age")
    return list(set(listi))


def combine_relations(relations):
    with open(FACTORQUESTIONS_FILE, "r") as f:
        factors = json.load(f)
    for factor,factor_info in factors.items():
        relations[factor] = {"type": "Input factor", "ancestors": [], "optimizability": factor_info["optimizability"]}
    with open(COMPUTED_FACTORS_FILE, 'r') as f:
        computed_factors = json.load(f)
    relations.update(computed_factors)
    for node_name, node in relations.items():
        relations[node_name]["color"]=make_hex_color(node_name)
    return relations


def integrate_and_interpolate_one(rr_dir, age_intervals, age_distribution, Ages):
    riskfactorgroup = {}
    normalizers, RRs, string_interaction_name = integrate_one(rr_dir, age_intervals, age_distribution)

    normalizer_age_object = initialize_data_frame_by_columns(Age=Ages, values_list=normalizers)
    print('normalizer age object -----------------------------------------------------')
    print(normalizer_age_object)
    riskfactorgroup['normalisingFactors'] = normalizer_age_object.get_as_standard_age_prevalences()
    riskfactorgroup['interactionFunction'] = string_interaction_name
    riskratiotables = []
    riskfactor_names = []

    for RR in RRs:
        RRlist = RR.get_as_list_of_lists()
        factor_names = RR.get_FactorNames()
        interpolated_RR = interpolate_one_spline(RR).as_json()
        riskratiotable = {'riskRatioTable': RRlist,
                          'riskFactorNames': factor_names,
                          'interpolationTable': interpolated_RR}
        riskratiotables.append(riskratiotable)
        riskfactor_names.extend(factor_names)
    riskfactorgroup['riskRatioTables'] = riskratiotables
    return riskfactorgroup, remove_duplicates_and_Age(riskfactor_names)


def integrate_and_interpolate_all(age_intervals, folder):
    '''
    input: age_intervals: list of tuples of intervals with start and end. 
    '''

    relations = get_cause_hierarchy(folder)
    cause_dirs = search_for_causes(folder)
    rr_dirs = search_for_rrs(folder)

    for disease, d_dic in relations.items():
        print(disease, ": ", d_dic["type"])

    writtenF_dirs = search_for_writtenF_directories(folder)

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
            print(rr_dir)
            rr_norm, riskfactor_names = integrate_and_interpolate_one(rr_dir, age_intervals, age_distribution, Ages)
            relations[disease]["ancestors"].extend(riskfactor_names)
            if disease in death_causes:
                death_causes[disease]["RiskFactorGroups"].append(rr_norm)
            else:
                death_cause_categories[disease]['RiskFactorGroups'].append(rr_norm)

    return relations, death_causes, death_cause_categories


def extract_cause_name(ICD_dir):
    return ICD_dir.split(os.sep)[-2]


def run(age_intervals=None):
    if age_intervals is None:
        age_intervals = get_age_totals()[0]
    relations, death_causes, death_cause_categories = integrate_and_interpolate_all(age_intervals, "Causes")
    transform_to_json(combine_relations(relations), RELATIONFILE_DESTINATION)
    transform_to_json(death_causes, CAUSES_DESTIONATION_FILE)
    transform_to_json(death_cause_categories, CATEGORY_CAUSES_DESTIONATION_FILE)
    # transform_to_json(integrate_all_in_folder(age_intervals, "Indirect_Causes"), "Indirect_causes_for_json")


def transform_to_json(inp, filename):
    # print inp
    with open(filename, 'w') as f:
        f.write(json.dumps(inp, default=lambda formula: str(formula)))


def integrate_one(writtenF_dir, age_intervals, age_distribution):
    '''
        input: writtenF_dir: a string directory to the folder of risk ratio files. 
               age_intervals: a list of list/tuples of numbers that give the age intervals to integrate separately.
        output: a list of normalizing constants. 
    '''
    RRs = rr.loadRRs(writtenF_dir)
    interaction, string_interaction_name = rr.read_interaction(writtenF_dir)
    tmp = str(RRs[0])
    RR = rr.make_simultane_and_get_writtenF(RRs, interaction)
    RRages = [factor_probabilities.adjust_to_age_group(RR, age_interval, age_distribution) for age_interval in
              age_intervals]

    factor_prob_data_frames = factor_probabilities.get_factor_probabilities(RR.get_categories(RR.get_FactorNames()),
                                                                            age_intervals)

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

def search_for_causes(folder):
    cause_dirs = []
    list_of_files = os.walk(os.path.join(os.pardir, "Database", folder))
    for path, dirs_within, _ in list_of_files:
        if "ICDfiles" in dirs_within:
            cause_dirs.append(path + os.sep + "ICDfiles")
    return cause_dirs


def search_for_rrs(folder):
    rr_dirs = {}
    list_of_files = os.walk(os.path.join(os.pardir, "Database", folder))
    for path, dirs_within, _ in list_of_files:
        for potential_rr in dirs_within:
            if potential_rr.startswith('rr_'):
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
