from frequencies import getFrequencies
from interpolation import interpolate_one
import factor_probabilities
import os
import time
import risk_ratios as rr
import json
from data_frame import initialize_data_frame_by_columns

from age_numbers import get_age_distribution, get_age_totals # to adjust the risk ratio to the age intervals

def integrate_all_in_folder(age_intervals, folder):
    '''
    input: age_intervals: list of tuples of intervals with start and end. 
    '''
    
    writtenF_dirs=search_for_writtenF_directories(folder)
    
    age_distribution=get_age_distribution()
    
    Ages=age_distribution.get_col("Age")
    
    to_be_jsoned={}
    for ICD_dir,rr_dirs in writtenF_dirs:
        cause_name=extract_cause_name(ICD_dir)
        rr_norms=[]
        for rr_dir in rr_dirs:
            #print rr_dir
            riskfactorgroup={}
            normalizers, RRs, string_interaction_name=integrate_one(rr_dir,age_intervals, age_distribution)
            
            normalizer_age_object=initialize_data_frame_by_columns(values_list=normalizers, Age=Ages).get_as_standard_age_prevalences()
            riskfactorgroup['normalisingFactors']=normalizer_age_object
            riskfactorgroup['interactionFunction']=string_interaction_name
            riskratiotables=[]
            for RR in RRs:
                RRlist=RR.get_as_list_of_lists()
                factor_names=RR.get_FactorNames()
                interpolated_RR_or_empty=interpolate_one(RR)
                if interpolated_RR_or_empty is None: #checking if there was something to interpolate
                    interpolated_RR=[]
                else:
                    interpolated_RR=interpolated_RR_or_empty.get_as_list_of_lists()
                riskratiotable={'riskRatioTable':RRlist,
                                'riskFactorNames':factor_names,
                                'interpolationTable':interpolated_RR}
                riskratiotables.append(riskratiotable)
            riskfactorgroup['riskRatioTables']=riskratiotables            
            rr_norms.append(riskfactorgroup)
        frequencies=getFrequencies(ICD_dir+os.sep)#, total_population)
        to_be_jsoned[cause_name]={'Age':frequencies.get_as_standard_age_prevalences(),
                                  'RiskFactorGroups':rr_norms}
    return to_be_jsoned
            
def extract_cause_name(ICD_dir):
    return ICD_dir.split(os.sep)[-2]


def run(age_intervals=None):
    if age_intervals is None:
        age_intervals= get_age_totals()[0]
    transform_to_json(integrate_all_in_folder(age_intervals, "Causes"), "Causes.json")
    transform_to_json(get_cause_hierarchy('Causes'), 'CauseHierarchy.json')
    #transform_to_json(integrate_all_in_folder(age_intervals, "Indirect_Causes"), "Indirect_causes_for_json")


def transform_to_json(inp, filename):
    #print inp
    with open(filename, 'w') as f:
        f.write(json.dumps(inp, default=lambda df: df.getDataframeAsList()))

        
def integrate_one(writtenF_dir, age_intervals,age_distribution):
    '''
        input: writtenF_dir: a string directory to the folder of risk ratio files. 
               age_intervals: a list of list/tuples of numbers that give the age intervals to integrate separately.
        output: a list of normalizing constants. 
    '''
    RRs=rr.loadRRs(writtenF_dir)
    interaction, string_interaction_name=rr.read_interaction(writtenF_dir)
    RR= rr.make_simultane_and_get_writtenF(RRs, interaction)
    RRages=[factor_probabilities.adjust_to_age_group(RR, age_interval, age_distribution) for age_interval in age_intervals]
    
    factor_prob_data_frames=factor_probabilities.get_factor_probabilities(RR.get_categories(RR.get_FactorNames()), age_intervals)
    
    normalizers=[]
    
    for RRage, factor_prob_data_frame in zip(RRages, factor_prob_data_frames):
        #print factor_prob_data_frame
        #print  RRage
        combined_df=factor_prob_data_frame*RRage
        normalizers.append(combined_df.sum())
        
    
    
    #RRs_as_dictionaries=[RR.getDataframeAsDictionary(RR.factornames) for RR in RRs]
    
    return normalizers, RRs, string_interaction_name

def create_normalizer_file(writtenF_dir, nums):
    '''
    input: writtenF_dir: string directory of the position of the riskratio files for which nums are the normalizers. 
    '''
    with open(writtenF_dir+"normalizer.txt", 'w') as f:
        for num in nums:
            f.write(str(num)+"\t")
    
        

    
    


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

def search_for_writtenF_directories(folder):
    writtenF_dirs=[]
    list_of_files=os.walk(os.path.join(os.pardir, "Database", folder))
    for path,dirs_within,_ in list_of_files: 
        if "ICDfiles" in dirs_within:
            rr_dirs=[path+os.sep+direc for direc in dirs_within if direc.startswith('rr_')]
            writtenF_dirs.append((path+os.sep+"ICDfiles",rr_dirs))
    return writtenF_dirs

def get_ancestor_chain(path, stop_string):
    ad=path.split(stop_string)[1]
    chain=ad.split(os.sep)
    return(chain)

def get_cause_hierarchy(folder):
    parents={}
    start_folder=os.path.join(os.pardir, "Database", folder)
    list_of_files=os.walk(start_folder)
    for path,dirs_within,_ in list_of_files: 
        if "ICDfiles" in dirs_within:
            ch=get_ancestor_chain(path, start_folder)
            if len(ch)>1:
                for p,c in zip(ch[:-1], ch[1:]):
                    parents[c]=p
    return parents
   

if __name__ == "__main__":
    start=time.time()
    print [f for f in os.walk(os.path.join(os.pardir, "Database", 'Causes'))]
    print get_cause_hierarchy('Causes')
    alist= search_for_writtenF_directories("Causes")
    #print alist
    #run()
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
         
 
     
    #make_simultane_and_get_writtenF(res,multiplicative(1,2))
    end=time.time()
    print end-start