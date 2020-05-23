
class data_frame:  # svend

    def __init__(self, factornames, credibility):  # factornames should be a list
        self.factornames = factornames
        self.reverse_factornames = {factor:index for index, factor in enumerate(factornames)}
        self.credibility = credibility
        self.listOfRowsInTheDataFrame = []
        
    def addRow(self, row):
        assert len(row) == len(self.factornames) + 1, "Row does not fit data frame."
        self.listOfRowsInTheDataFrame.append(row)
        
    def __len__(self):
        return len(self.listOfRowsInTheDataFrame)
    
    def __mul__(self, other):
        '''
        receives two dataframes with identical factor categories and factor values (in arbitrary order). 
        Returns the one where the value column has been multplied with each other.
        '''
        #print self.factornames, other.factornames
        assert set(self.factornames)==set(other.factornames), "the two dataframes are not compatible because of different factor categories."
        factornames=self.factornames #arbritrary that it is not other.factornames - only the order matters here.
        oth=other.getDataframeAsDictionary(factornames)
        sel=self.getDataframeAsDictionary(factornames)
        df=data_frame(factornames, min(other.credibility,self.credibility))
        #print sel
        #print oth
        for key, val in sel.items():
            assert key in oth, "the two data frames are not compatible because of different factor values"
            df.addRow(list(key)+[val*oth[key]])
        return df
    
    def sum(self):
        return sum([ r[-1] for r in self.listOfRowsInTheDataFrame])
    
    def getRowByIndex(self,index):
        return self.listOfRowsInTheDataFrame[index]
    
    def getDataframeAsDictionary(self, factornames):
        assert set(factornames)==set(self.factornames), "the dictionary requested does not match that of the dataframe"
        res={}
        indices=[ i for _,oth in enumerate(factornames) for i,sel in enumerate(self.factornames) if sel==oth] #this is the order in which to put the columns of self.
        for row in self.listOfRowsInTheDataFrame:
            res[ tuple( row[indices[i]] for i in range(len(row)-1)) ]= row[-1]
        return res
    
    def get_last_column_in_specific_order(self, factor_keys):
        df_dic=self.getDataframeAsDictionary(self.factornames)
        return [df_dic[fkey] for fkey in factor_keys]
        
    def getDataframeAsList(self):
        res=[row for row in self.listOfRowsInTheDataFrame]
        res.insert(0,self.factornames)
        return res
    
    def save_to_file(self, fil):
        df=self.getDataframeAsList()
        with open(fil, 'w') as f:
            f.write(','.join(df[0]+['Value'])+'\n')
            for r in df[1:]:
                f.write(','.join(r[:-1]+[r[-1][1]])+'\n')
                
        
    def __dict__(self):
        self.getDataframeAsList()
        
    def __str__(self):
        '''
        This function returns the string that should be printed when an instance is printed
        '''
        str1 = "Credibility=" + str(self.credibility) + "\n"
        str1 += "\t".join(self.factornames) + "\t" + "Value" + "\n"
        for row in self.listOfRowsInTheDataFrame:
            str1 += "\t".join(map(str, row)) + "\n"
        return str1
    
    def group_by(self, variables):
        not_variables=list(set(self.factornames)-set(variables))
        newly_created_dataframes={}
        indices=[i for i,s in enumerate(self.factornames) if s in variables]
        not_indices=[i for i,s in enumerate(self.factornames) if s in not_variables]
        if len(indices)==0:
            return { tuple():self}
        for row in self.listOfRowsInTheDataFrame:
            factor_tuple=tuple((row[i] for i in indices))
            row_to_add=[row[i] for i in not_indices]+[row[-1]]
            if factor_tuple in newly_created_dataframes:
                newly_created_dataframes[factor_tuple].addRow(row_to_add)
            else:
                new_data_frame=data_frame(not_variables,self.credibility)
                new_data_frame.addRow(row_to_add)
                newly_created_dataframes[factor_tuple]=new_data_frame
        return newly_created_dataframes
        
        
        
    def subset(self, conditions):
        '''
        Input: dictionary conditions of the form 
        {'factor_name1':['possible_value_1^1',...,'possible_value_r^1'],...,
         'factor_nameM':['possible_value_1^M',...,'possible_value_s^M'] }
        Output: a list of rows where: factor_name1 \in ['possible_value_1^1',...,'possible_value_r^1'], factor_name2 \in ,...,
                                        'factor_nameM' \in ['possible_value_1^M',...,'possible_value_s^M']
        If a factor is not specified as a key, any value will be acceptable for that 
        '''
        
        # reducing the number of conditions while at the same time converting from factor-string to factor number.
        reduced_conditions = {self.reverse_factornames[key]:val for key, val in conditions.items() if key in self.factornames}
                
        ans = []
        for row in self.listOfRowsInTheDataFrame:
            keepRow = True
            for factor_number, set_of_possibles in reduced_conditions.items():
                if row[factor_number] not in set_of_possibles:
                    keepRow = False
            if keepRow:
                ans.append(row)
        return ans
    
    
    
    def summed_subsets(self, list_of_factors):
        '''
        Input: list of the form 
        ['factor_name1',...,'factor_nameM']
                Output: a dictionary of {combination_of_factorCategories_as_tuple:prob_of_that_combination_as_float}
        '''
        
        # converting desired factor name to desired factor index.
        reduced_conditions = [self.reverse_factornames[factor] for factor in list_of_factors if factor in self.factornames]
                
        # print(reduced_conditions)
        ans = {}
        for row in self.listOfRowsInTheDataFrame:
            key = []
            for factor_number in reduced_conditions:
                key.append(row[factor_number])
            ans[tuple(key)] = ans.get(tuple(key), 0) + row[-1]
        
        return ans
    
    def get_categories(self, factors):
        '''
        input factors: list of strings of factornames
        output: dictionary of all values of each of the factors
        '''
        categories = {}
        for f in factors:
            index = self.reverse_factornames[f]
            categorylist = set(row[index] for row in self.listOfRowsInTheDataFrame)
            categories[f] = list(categorylist)
        
        return categories
          
    def get_FactorNames(self):
        return self.factornames
    
    def get_credibility(self):
        return self.credibility
    
    
    def frequency_for_row(self, conditions):
        '''
        Input: dictionary conditions of the form 
        {'factor_name1':'possible_value_1,...,'factor_nameM':'possible_value_M'}
        Output: float, which is the frequency in the dataframe for the given condition
        If a factor in the dataframe is not specified as a key in the conditions, an error will be returned 
        '''
        for key in conditions.keys():
            assert key in self.factornames, 'A factor in the dataframe is not specified'
                
        reduced_conditions = {self.reverse_factornames[key]:val for key, val in conditions.items()}
        
        wanted_row=[]
        for index, value in reduced_conditions.items():
            wanted_row.insert(index,value)         
        
        for row in self.listOfRowsInTheDataFrame:
            if row[:-1]==wanted_row:
                return row[-1]