'''
Created on 17/09/2016

@author: Svend og Christian

this file contains functions to analyse and manipulate factor levels.
'''


def getIntersectionAndSize(list1, list2):
    if list1[1] == list2[1] == float('Inf'):
        return 1, str(min(list1[0],list2[0]))+"+"
    lower=max(list1[0], list2[0])
    upper=min(list2[1], list1[1])
    return max(0, upper-lower ), str(lower)+"-"+str(upper)
    
def isInInterval(point, interval, type_interval):
    if type_interval == 'x':
        if (abs(interval[0] - point) < 1e-8):
            return 1,str(point)
        else:
            return 0,None
    open_in_bottom = (type_interval != '-x')
    if point <= interval[1] + 1e-8:
        if point >= interval[0] - 1e-8:
            if abs(point - interval[0]) < 1e-8:
                if open_in_bottom:
                    return 0, None
                return 1, str(point)
            return 1, str(point)
    return 0, None
   
    
def intersect_of_one_coordinate(*factor):
    '''
    same task as intersect_size_of_one_coordinate just with intersection of n coordinates instead of 2.
    '''
    factors=list(*factor) #making a list of all the factors.
    size,fact=intersect_and_size_of_one_coordinate(factors[0],factors[1])
    for i in xrange(2,len(factors)):
        print fact
        if fact is None:
            break
        size,fact= intersect_and_size_of_one_coordinate(fact, factors[i])
    return fact, size
    
    

def intersect_and_size_of_one_coordinate(factor1, factor2):
    type_1, values_1 = factor_type(factor1)
    type_2, values_2 = factor_type(factor2)
    
    # checking if both or one of them is a string
    if type_1 == 'str' == type_2:
        return (values_1 == values_2) * 1, values_1[0]
    if type_1 == 'str' or type_2 == 'str':
        return 0, None
    
    # checking if one of them is a point
    if type_1 == "x":
        return isInInterval(values_1[0], values_2, type_2)#, str(values_1[0])
    if type_2 == 'x':
        return isInInterval(values_2[0], values_1, type_1)#, str(values_1[0])  #
    
    # if this point is reached, both are intervals
    return getIntersectionAndSize(values_1, values_2)

def intersect_size(f1, f2):
    '''
    input: f1 factor category
    input: f2 factor category
    output: float describing the size of intersection
    '''
    ans = 1
    for factor1, factor2 in zip(f1, f2):
        ans *= intersect_and_size_of_one_coordinate(factor1, factor2)[0]
    return ans
      
    
    
def category_size(f1):  # svend
    '''
    input: f1 factor category
    output: float describing the size of intersection
    '''
    ans = 1
    for factor in f1:
        if "-" in factor:
            numbers = factor.split("-")
            if not numbers[0]:  # if numbers[0] is empty, it means that the factor category is of the form "-x", where x is a number
                ans *= float(numbers[1])
            else:
                ans *= float(numbers[1]) - float(numbers[0])
    return ans
            
            
def factor_type(factor):
    if '+' in factor:
        return 'y+', (float(factor.split("+")[0]), float('Inf'))
    elif '-' in factor:
        numbers = factor.split('-')
        if not numbers[0]:
            return '-x', (0.0, float(numbers[1]))
        else:
            return 'x-y', (float(numbers[0]), float(numbers[1]))
    else:
        try: 
            float(factor)
            return 'x', (float(factor),)
        except ValueError:
            return 'str', (factor,)
    
