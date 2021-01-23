'''
Created on 25/02/2016

@author: Svend og Christian
'''
import itertools
import operator
import os
from age_numbers import get_age_distribution
from data_frame import data_frame
from factor_levels import intersect_and_size_of_one_coordinate, category_size, intersect_size

FACTOR_PROB_PATH = os.path.join(os.pardir, "Database", "Factor_frequencies")


def get_factor_probabilities(written_F, age_intervals):
    ans = []
    for age_interval in age_intervals:
        ans.append(get_factor_probabilities_for_one_age_interval(written_F, age_interval))
    return ans


def get_factor_probabilities_for_one_age_interval(writtenF, age_interval):
    '''
    input: writtenF. Type: dictionary of {'factorname_1': ['f_1^1', 'f_1^2',..., 'f_1^n'], ... , 'factorname_k': ['f_k^1', 'f_k^2',..., 'f_k^n']}
    output: data frame where it is easy to extract P(F=f) for f in written F
    '''
    # print writtenF

    listOfDataframes, not_included = load_and_thin_out(writtenF.keys(), FACTOR_PROB_PATH)

    age_dist = get_age_distribution()

    # print listOfDataframes

    # adjust_to_age_interval
    listOfDataframes = [adjust_to_age_group(dat_frame, age_interval, age_dist) for dat_frame in listOfDataframes]

    # print listOfDataframes

    # marginalize each relevant dataframe
    listOfDataframes = [marginalize(dat_frame, writtenF.keys()) for dat_frame in listOfDataframes]

    # print listOfDataframes

    # adjust to RR categories
    listOfDataframes = [adjust_to_RR_categories(writtenF, dat_frame) for dat_frame in listOfDataframes]

    # print listOfDataframes



    # add the data frames corresponding to the factors that did not find a matching file
    listOfDataframes.extend([trivial_data_frame(writtenF[factor], factor) for factor in not_included])

    print("listOfDataframes")
    for d in listOfDataframes:
        print(d.listOfRowsInTheDataFrame)

    # get one big dataframe
    return make_simultane(listOfDataframes)


def trivial_data_frame(factor_levels, factor):
    '''
    constructs a data frame with the factor, factor, and its factor levels, factor_levels. Each factor level has the same weight. 
    input factor_levels: a list [f_1^1, f_1^2, ..., f_1^n] for the factor corresponding to f_1.
          factor: a string representing the name of the factor, f_1
    output: a data frame
    '''

    df = data_frame([factor], 0)
    n = len(factor_levels)
    for f in factor_levels:
        df.addRow([f] + [float(1.0) / n])
    return df


def adjust_to_age_group(dataframe, age_interval, age_distribution):
    '''
    Input: a dataframe that may or may not have the column age
            age_interval: string format of factor level.
            age_distribution: dataframe with only one column, the Age.
    Output: a dataframe that does not have the age column, but corresponds to the age interval
    '''

    if "Age" not in dataframe.get_FactorNames():
        return dataframe

    index_of_age_column = dataframe.get_FactorNames().index("Age")

    new_rows = {}
    for row in dataframe.listOfRowsInTheDataFrame:
        age_category_of_row = row[index_of_age_column]
        factors = row[:index_of_age_column] + row[(index_of_age_column + 1):-1]
        intersect, _ = intersect_and_size_of_one_coordinate(age_category_of_row, age_interval)
        if intersect > 0:
            #             print factors
            #             print new_rows
            #             a=new_rows.get(factors,0)
            #             b=row[-1]
            #             c=category_size(age_interval)
            #             print a,b,c
            new_rows[tuple(factors)] = new_rows.get(tuple(factors), 0) + row[-1] * intersect / category_size(
                [age_interval])

    factors_with_age = dataframe.get_FactorNames()
    factors_without_age = factors_with_age[:index_of_age_column] + factors_with_age[(index_of_age_column + 1):]

    res = data_frame(factors_without_age, dataframe.get_credibility())

    for factor_levels, p in new_rows.items():
        res.addRow(list(factor_levels) + [p])

    return res


def load_and_thin_out(listOfFactorNames, path):
    '''
    Input: A list of relevant factors, for which dataframes are wanted and a path specified the location of factor frequency files
    Output: A list of only relevant dataframes (judged by credibility according to "notation and integration.pdf")
            list of factors that are not included, see search_for_files.
    '''
    res, non_included = find_dataframes_with_credibility(listOfFactorNames, path)

    res = thin_out(res, listOfFactorNames)

    return parse_data(res), non_included


def find_dataframes_with_credibility(listOfFactornames, path):
    '''
    Input: list of factor names e.g.: [factor1, factor2,...,factorN] and the path of the folder containing factor_frquency files
    Output: list of (path,list of factor names,credibility): 
    [(path1,[factor^1_1,...,factor^(k_1)_1],cred_1),...,(path_m,[factor^m_1,...,factor^(k_m)_1],cred_m)]
    where path_j is the path to the file containing the dataframe with factor^1_j,...,factors^(k_j)_j whose credibility is cred_j
            list of factors that are not included, see search_for_files.
    '''
    files, non_included = search_for_files(listOfFactornames, path)
    listOfPathNamesCred = []

    for fil in files:
        filpath = os.path.join(path, fil)
        listOfPathNamesCred.append(parse_cred_and_factornames(filpath))

    return listOfPathNamesCred, non_included


def search_for_files(listOfFactornames, path):
    '''
    Input: list of factor names e.g.: [factor1, factor2,...,factorN] and the path of the folder containing factor_frquency files
    Output: list of files [file1,file2,...,fileM], where file_j is in the path and file_j includes at least 1 of the factors in listOfFactornames.
            list of factor names [factorA, factorB, ..., factorC] where A,B,...,C is a subset of 1,...,N and is the factors which were not found in any file. 
    '''
    listOfFiles = os.listdir(path)
    resList = []
    included_factors = []
    for f in listOfFiles:
        fs = f.split(".")[0].split("-")
        for factor in listOfFactornames:
            if factor in fs:
                included_factors.append(factor)
                resList.append(f)
    not_included_factors = set(listOfFactornames).difference(included_factors)
    return list(set(resList)), not_included_factors


def parse_cred_and_factornames(filpath):
    '''
    Input: a file path pointing to a dataframe file
    Output: a tuple (filpath,factorNames,cred), where filpath is the original file path, 
    factorNames is a list of the factors in the dataframe and cred is the credibility of the dataframe
    '''
    print('filename', filpath)
    with open(filpath) as f:
        for i, line in enumerate(f):
            if i == 0:
                splitLine = line.split("=")
                cred = float(splitLine[-1])
            elif not line.startswith("#"):
                splitLine = line.split()
                factorNames = splitLine[:-1]
                return filpath, factorNames, cred


def thin_out(listOfPathNamesCred, relevantFactors):
    '''
    Input: a list of (path,listOfFacorNames,Cred) and a list of relevant factors
    Output: A reduced list of (path,listOfFacorNames,Cred) containing only relevant dataframes. 
    '''
    res = list(listOfPathNamesCred)  # (deep?) copy of the list
    relevantFactors = set(relevantFactors)

    for (path, names, cred) in listOfPathNamesCred:
        dfFactors = set(names)
        dfIntersection = dfFactors.intersection(relevantFactors)

        for (_, resNames, resCred) in res:
            dfKeepFactors = set(resNames)
            dfKeepIntersection = dfKeepFactors.intersection(relevantFactors)

            subsetCondition = dfIntersection.issubset(dfKeepIntersection)
            credCondition = resCred > cred

            if subsetCondition and credCondition:
                if (path, names, cred) in res:
                    res.remove((path, names, cred))
                    break
    # print len(res), len(listOfPathNamesCred)
    return res


def parse_data(thinnedOutListOfPathNamesCred):
    '''
    Input: a list of (path,ListOfFactorNames,Cred)
    Output: a list of dataframes (df1,df2,...,df_N), whose factors are the ones from ListOfFactorNames, and whose credibility is cred from the input list.
    '''
    res = []
    for (path, names, cred) in thinnedOutListOfPathNamesCred:
        j = 0
        with open(path) as f:
            df = data_frame(names, cred)
            for line in f:
                if not line.startswith("#"):
                    if j == 0:
                        j += 1
                    elif j > 0:
                        splitLine = line.split()
                        splitLine[-1] = float(splitLine[-1])
                        df.addRow(splitLine)
        res.append(df)
    return res


def marginalize(dataframe, factorsToKeep):
    '''
    input dataframe type data frame with numbers
    input factorsToKeep: list of factors to keep in marginalization.
    This function implements solution to problem 4
    output data frame
    '''
    # the lists are coerced through set to remove duplicates 
    factors = [f for f in factorsToKeep if f in dataframe.get_FactorNames()]
    #     factors=[]
    #     for f in factorsToKeep:
    #         if f in dataframe.get_FactorNames():
    #             factors.append(f)

    marginalized_df = data_frame(factors, dataframe.get_credibility())

    summed_subsets = dataframe.summed_subsets(factors)
    for factor_values, factor_probability in summed_subsets.items():
        marginalized_df.addRow(list(factor_values) + [factor_probability])

    return marginalized_df


def adjust_to_RR_categories(writtenF, dataframe):
    '''
    input: dataframe: the dataframe that we want an version of, which is adjusted to writtenF
    input: writtenF. 
    This function implements solution to problem 1.
    output data frame
    '''
    # A list containing lists of category divisions is made.
    # It is checked that all factors in the dataframe is specified in writtenF
    listOfCategories = []
    for factorname in dataframe.get_FactorNames():
        assert factorname in writtenF, "A factor category in the dataframe is not specified by writtenF. Please fix"
        listOfCategories = listOfCategories + [writtenF[factorname]]

    # A new dataframe which will contain the adjusted categories is made
    adjusted_df = data_frame(dataframe.get_FactorNames(), dataframe.get_credibility())

    # The new factor probabilities are calculated and the rows are added to the adjusted dataframe
    for element in itertools.product(*listOfCategories):
        row = list(element)
        newProb = 0
        #         print "f_i", row
        for oldRow in dataframe.listOfRowsInTheDataFrame:
            #             if intersect_size(oldRow[:-1],row)>0:
            #                 print "f_j'", oldRow[:-1]
            #                 print "".join(["+P(F_i=f_i)*intersect(f_i,f_j')/category_size(f_i)=",
            #                               "+",
            #                               str(oldRow[-1]),
            #                               "*",
            #                               str(intersect_size(oldRow[:-1],row)),
            #                               "/",
            #                               str(category_size(oldRow[:-1]))])
            newProb = newProb + oldRow[-1] * intersect_size(oldRow[:-1], row) / category_size(oldRow[:-1])
        adjusted_df.addRow(row + [newProb])
    return adjusted_df


def make_simultane(listOfdataframes):
    '''
    Input: list of dataframes [df1,df2,...] containing factor probabilities for each of the loaded files.
    Output: single marginalized dataframe
    This function implements solution to problem 2,3 and 5.
    '''
    # First a list of dataframes sorted by credibility is created.
    sorted_dfs = sortDataframes(listOfdataframes)

    # The categories for all factors are loading into a dictionary
    factorDic = getAllCategories(listOfdataframes)
    factorDicKeys = factorDic.keys()
    factorDicValues = factorDic.values()

    # The resulting dataframe is created and
    # print listOfdataframes
    minimum_credibility = sorted_dfs[0][1]
    res = data_frame(factorDicKeys, minimum_credibility)
    cartesianProducts = list(itertools.product(*factorDicValues))
    dfrows = []
    for element in cartesianProducts:
        p0 = 1.0 / len(cartesianProducts)
        row = list(element) + [p0]
        dfrows.append(row)

    # The adjustment to marginalization algorithm
    for (df, _) in sorted_dfs:
        newrows = list()
        for row in dfrows:
            # P(F^1=f^1(f)), i.e the numerator
            reverse_name = {factor: index for index, factor in enumerate(factorDicKeys) if
                            factor in df.get_FactorNames()}
            reverse_nameKeys = reverse_name.keys()
            reverse_nameValues = reverse_name.values()
            possible_factor_values = {factor: [row[index]] for factor, index in
                                      zip(reverse_nameKeys, reverse_nameValues)}
            pdf = df.subset(possible_factor_values)[0][-1]

            # The denominator
            reslist = []
            for rowprime in dfrows:
                if [row[i] for i in reverse_nameValues] == [rowprime[i] for i in reverse_nameValues]:
                    reslist.append(rowprime)
            denomsum = sum(i[-1] for i in reslist)
            newrow = list(row)
            newrow[-1] = newrow[-1] * pdf / denomsum
            newrows.append(newrow)
        dfrows = list(newrows)

    for row in dfrows:
        res.addRow(row)

    return res


def sortDataframes(listOfDataframes):
    '''
    Input: list of dataframes [df1,df2,...]
    Output: A list of tuples [(df'1,cred_df'1),(df'2,cred_df'2),...} sorted by credibility scores
    '''
    credDic = {}
    for df in listOfDataframes:
        credDic[df] = df.get_credibility()
    return sorted(credDic.items(), key=operator.itemgetter(1))


def getAllCategories(listOfDataframes):
    '''
    Input: list of dataframes [df1,df2,...]
    Output: Dictionary {factor1:[factor categories for factor1], ...}
    Note that all dataframes are adjusted to RR categories before this function is called,
    thus it doesn't matter which dataframe is used to get the categories for a given factor. 
    '''
    #     factors = []
    factorDic = {}
    for df in listOfDataframes:
        #         for factor in df.get_FactorNames():
        #             if factor not in factors:
        #                 factors.append(factor)
        factorDic.update(df.get_categories(df.get_FactorNames()))
    return factorDic


if __name__ == "__main__":
    #
    #     df1 = data_frame(["Drinking"], 30.0)
    #     df2 = data_frame(["BMI"], 5.0)
    #     df3 = data_frame(["Drinking", "BMI"], 10.0)
    #     df4 = data_frame(["Drinking"], 100.0)
    #     df5 = data_frame(["Drinking", "BMI", "Alcohol"], 20.0)
    #
    #     for df in thin_out_unnecessary_dataframes([df1,df2,df3,df4,df5],["Drinking","Alcohol"]):
    #         print df
    #
    # ===========================================================================
    # df = data_frame(["Drinking", "Alcohol", "BMI"], 300.0)
    # df.addRow(["0", "0", "-25", 0.15])
    # df.addRow(["0", "0+", "-25", 0.20])
    # df.addRow(["0+", "0", "-25", 0.06])
    # df.addRow(["0+", "0+", "-25", 0.04])
    # df.addRow(["0", "0", "25+", 0.15])
    # df.addRow(["0", "0+", "25+", 0.30])
    # df.addRow(["0+", "0", "25+", 0.05])
    # df.addRow(["0+", "0+", "25+", 0.05])
    # 
    # df2 = data_frame(["Drinking", "Alcohol"], 4.0)
    # df2.addRow(["0", "-20", 1.0 / 3])
    # df2.addRow(["0", "20-35", 1.0 / 15])
    # df2.addRow(["0", "35+", 1.0 / 9])
    # df2.addRow(["0-15", "-20", 1.0 / 15])
    # df2.addRow(["0-15", "20-35", 1.0 / 9])
    # df2.addRow(["0-15", "35+", 1.0 / 15])
    # df2.addRow(["15+", "-20", 1.0 / 15])
    # df2.addRow(["15+", "20-35", 1.0 / 15])
    # df2.addRow(["15+", "35+", 1.0 / 9])
    # ===========================================================================

    # ===========================================================================
    # df = data_frame(['Smoking', 'Alcohol'], 1000)
    # df.addRow(['0', '-20', 0.1])
    # df.addRow(['0+', '-20', 0.2])
    # df.addRow(['0', '20+', 0.3])
    # df.addRow(['0+', '20+', 0.4])
    # df2 = data_frame(['Sex','Alcohol'], 10000)
    # df2.addRow(['M','-20',0.20])
    # df2.addRow(['M','20+',0.25])
    # df2.addRow(['F','-20',0.4])
    # df2.addRow(['F','20+',0.15])
    # print make_simultane([df,df2])
    # ===========================================================================

    # platform_independent_path= #making the path platform independent.
    #     tmp=load_and_thin_out(['Gender','Drinking','Fish'], FACTOR_PROB_PATH)
    #     print tmp
    #     for df in tmp:
    #         print df

    #     print df
    #     print df.frequency_for_row({'Age':'-25','Gender':'Male','BMI':'18.5-25'})

    # writtenF={'Drinking':["0","0+"], 'Alcohol':{'0','0-5','5-46','46+'}}

    # res_df=adjust_to_RR_categories(writtenF, df)

    # print res_df
    # print intersect_size(["0","-20"],["0","0"]),1.0/20
    # print intersect_size_of_one_coordinate("0","0"),1
    # print intersect_size_of_one_coordinate("")
    # print category_size(["0","-20"])

    #     df.addRow(["0","0+","-25",0.20])
    #     df.addRow(["0+","0","-25",0.06])
    #     df.addRow(["0+","0+","-25",0.04])
    #     df.addRow(["0","0","25+",0.15])
    #     df.addRow(["0","0+","25+",0.30])
    #     df.addRow(["0+","0","25+",0.05])
    #     df.addRow(["0+","0+","25+",0.05])

    # print df
    # print df.subset({'Drinking':['0'],'Alcohol':['0','0+'],'BMI':["-25"]})
    # print marginalize(df,["BMI"])

    # print df.summed_subsets(['Alcohol','BMI'])

    # wF={'Drinking':['0','0+'],'Alcohol':['0','0+'],'BMI':['-20','20-25','25+']}
    # print adjust_to_RR_categories(wF,df)

    #     print intersect_size_of_one_coordinate('20','20+'),0
    #     print intersect_size_of_one_coordinate('20','20'),1
    #     print intersect_size_of_one_coordinate('20','10-20'),1
    #     print intersect_size_of_one_coordinate('20','-30'),1
    #     print intersect_size_of_one_coordinate('20','18-19'),0
    #     print intersect_size_of_one_coordinate('20','21-22'),0
    #
    #     print intersect_size_of_one_coordinate('20-30','20-30'),10
    #     print intersect_size_of_one_coordinate('20-30','-30'),10
    #     print intersect_size_of_one_coordinate('26.5-28.5','20-30'),2
    #     print intersect_size_of_one_coordinate('10-20','20-30'),0
    writtenF = {"Gender": ["Male", "Female"], "Sexuality": ["Female", "Male", "Both", "None"],
                "Drinking": [",5", "5,10", "10,20", "20+"]}
    ldf = get_factor_probabilities(writtenF, "40-50")
    print(ldf)
    r = 0
    for f in ldf.listOfRowsInTheDataFrame:
        r = r + float(f[-1])
    print(r)
