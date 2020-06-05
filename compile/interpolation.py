from numpy import array, prod, zeros, savetxt
from numpy.linalg import inv
from factor_levels import factor_type, NUMERICAL_FACTOR_TYPES, interval_length, factor_level
from itertools import product
from data_frame import data_frame

def get_subset(i):
    '''
    Function that makes the ordering of the 2^n possible sets from {1, ..., n}
    '''
    s=bin(i)
    s=s[2:]
    res=[]
    for i,k in enumerate(s[::-1]):
        if k=='1':
            res.append(i+1)
    return(res)

def get_subset_iterator(i):
    s=bin(i)
    s=s[2:]
    res=[]
    for k in s[::-1]:
        if k=='1':
            yield True
        else:
            yield False
            
def get_subset_iterator_full(i,n):
    s=bin(i)
    s=s[2:]
    s='0'*(n-len(s))+s
    res=[]
    for k in s[::-1]:
        if k=='1':
            yield True
        else:
            yield False
            
def interpolate_list_of_RRs(RRs):
    res=[]
    for RR in RRs:
        res.append(interpolate_one(RR))
    return res

def truncate(jvec, kvec):
    res=[]
    for j,k in zip(jvec, kvec):
        res.append(max(0,min(j,k-2)))
    return tuple(res)

def fill_Bmatrix(corner_dic, kvec):
    '''
    The B matrix is made. It is k*k where k is the product of kvec. The corner_dic is a dicitionary of 
    '''
    k=prod(kvec)
    assert len(corner_dic)==k,'incorrect corner_dic'
    B=zeros((k,k))
    order_dic={}
    for n,jvec in enumerate(product(*map(range,kvec))):
        order_dic[jvec]=n
    for jvec in product(*map(range,kvec)):
        data_point=corner_dic[jvec]
        row_of_B=order_dic[jvec]
        for i,h_vec in enumerate(data_point.H):
            j_alt= [jvec[j] if include else jvec[j]-1 for j,include in enumerate(get_subset_iterator_full(i, len(jvec)))]
            j_v=truncate(j_alt,kvec)
            other_data_point=corner_dic[j_v]
            y_indices=other_data_point.get_interpolation_indices()

            contributing_vector=h_vec.dot(other_data_point.iV) #AM I sure about this ordering? That is, the ordering of the points in h_vec aligns with that of V
            #print order_dic[y_indices[-1]], contributing_vector[-1]
            for y_index, summant in zip(y_indices, contributing_vector):
                B[row_of_B, order_dic[y_index]]+=summant
    return B, order_dic

def set_interpolation_area_bounds(interpolation_corner_dic, interpolation_keys, kvec):
    for jvec in interpolation_keys:
        corner=interpolation_corner_dic[jvec]
        superior_jkey=tuple((j+1 for j in jvec))
        superior_corner=interpolation_corner_dic[superior_jkey]
        for n,(j,k) in enumerate(zip(jvec, kvec)):
            
            if j==0:
                lower_bound=corner.get_lower_of_factor_point(n)
            else:
                lower_bound=corner.get_midpoint_of_factor_point(n)
            if j==k-1:
                upper_bound=superior_corner.get_upper_of_factor_point(n)
            else:
                upper_bound=superior_corner.get_midpoint_of_factor_point(n)
                
            corner.set_lower_bound(lower_bound, n)
            corner.set_upper_bound(upper_bound, n)
        
    


class InterpolationCorner(object):
    
    def __init__(self, factor_point, factor_point_index):
        '''
        a factor point is a list of factor_levels from DIFFERENT factors. 
        '''
        self.factor_point=factor_point
        self.factor_point_index=factor_point_index
        self.v=None
        self.V=None
        self.H=None
        self.other_corners=None
        self.lower_bounds=[None]*len(self.factor_point)
        self.upper_bounds=[None]*len(self.factor_point)
        
    def str_interpolation_area(self):
        return 'x'.join(["[{:.2f},{:.2f}]".format(l,u) for l,u in zip(self.lower_bounds, self.upper_bounds)])
        
    def str_risk_ratio_area(self):
        return 'x'.join(["[{:.2f},{:.2f}]".format(f.lowerBound,f.upperBound) for f in self.factor_point])
        
    def interpolation_area_encoded(self):
        res=[]
        for l,u in zip(self.lower_bounds, self.upper_bounds):
            if (u-l)<1e-6:
                res.append('{:.4f}'.format(l))
            else:
                res.append('{:.4f}-{:.4f}'.format(l,u))
        return res
    
    def get_lower_of_factor_point(self, index):
        return self.factor_point[index].lowerBound
    
    def get_upper_of_factor_point(self, index):
        return self.factor_point[index].upperBound
    
    def get_midpoint_of_factor_point(self, index):
        return self.factor_point[index].midPoint
    
    def get_size(self):
        res=1
        for flevel in self.factor_point:
            res=res*flevel.getSize()
        return res
        
    def set_lower_bound(self, val, index):
        self.lower_bounds[index]=val
    
    def set_upper_bound(self, val, index):
        self.upper_bounds[index]=val
        
    def get_other_corners(self):
        assert self.other_corners is not None, "other corners were requested from a corner without other corners. The corner is "+str(self.factor_point_index)
        return self.other_corners
    
    def get_coefficients(self, order_dic, y_vals):
        reduced_y=[]
        for index in self.get_interpolation_indices():
            reduced_y.append(y_vals[order_dic[index]])
        y=array(reduced_y)
        return (self.iV).dot(y)
    
    def get_interpolation_indices(self):
        res=[self.factor_point_index]
        for corner in self.get_other_corners():
            res.append(corner.factor_point_index)
        return res
        
    def fill_Bmatrix(self):
        print self.factor_point_index
        for i,h in enumerate(self.H):
            j=[fi if include else fi-1 for fi,include in zip(self.factor_point_index, get_subset_iterator_full(i,len(self.factor_point_index)))]
                                                    
        
    def z(self, dimension):
        '''
        this returns the midpoint, that is the interpolationCorner. 
        In the theory, it would be called z(dimension, j(dimension)) where j(dimension) is the value necessary to refer to self.
        '''
        return self.factor_point[dimension].midPoint
    
    def v_vec(self):
        if self.v is None:
            zv=[self.z(d) for d in range(len(self.factor_point))]
            v=[]
            for i in range(2**len(zv)):
                prod_res=1
                for n,include in enumerate(get_subset_iterator_full(i,len(zv))):
                    if include:
                        prod_res*=zv[n]
                v.append(prod_res)
            self.v=v
        return self.v
            
        
        
    def add_OtherCorners(self, list_of_interpolation_corners):
        '''
        The list of interpolation_corners have to be put in the correct order, according to get_subset
        '''
        self.other_corners=list_of_interpolation_corners
        
    def invertV(self):
        self.iV=inv(self.V)
        
    def computeV(self):
        vmat=[self.v_vec()]
        for corner in self.other_corners:
            vmat.append(corner.v_vec())
        self.V=array(vmat)
        
    def computeH(self):
        hvecs=[]
        n=len(self.factor_point)
        for quadrant_i in range(2**n):
            hvec=[]
            quadrants=[self.factor_point[i].getInterval(after_midpoint=include) for i,include in enumerate(get_subset_iterator_full(quadrant_i, n))]
            for Jset_i in range(2**n):
                in_pairs=[]
                out_pairs=[]
                for i,include in enumerate(get_subset_iterator_full(Jset_i, n)):
                    if include:
                        in_pairs.append(quadrants[i])
                    else:
                        out_pairs.append(quadrants[i])
                hvec.append(Hfunction(in_pairs, out_pairs))
            hvecs.append(hvec)
        self.H=array(hvecs)/self.get_size()
        
                
                
            
        
def Hfunction(in_pairs, out_pairs):
    res=1
    for z_minus,z_plus in in_pairs:
        if z_plus-z_minus<1e-6:
            res*=z_minus
        else:
            res*=0.5*(z_plus**2-z_minus**2)
    for z_minus, z_plus in out_pairs:
        if z_plus-z_minus>1e-6:
            res*=(z_plus-z_minus)
        else:
            res*=0.5
    return res
        
        

def get_interpolatable(factor_levels):
    '''
    input: dictionary {factor1: ['f_1^1', ..., 'f_{k_1}^1'],
                       factor2: ['f_1^2', ..., 'f_{k_2}^2'],
                       ...
                       factorN:  ['f_1^n', ..., 'f_{k_n}^n']
                       }
    output: list of strings [factor_{i1}, \dots factor_{iB}]
    This function returns the factors that are egligible for interpolation, that is, all of the values are numeric
    '''
    interpolatable_factors=[]
    for factor_name, factor_values in factor_levels.items():
        all_numeric=True
        seen_interval=False
        for f in factor_values:
            ft=factor_type(f)[0]
            print f, ft
            if not ft in NUMERICAL_FACTOR_TYPES:
                all_numeric=False
            if ft=='x-y':
                seen_interval=True
        if all_numeric and seen_interval:
            interpolatable_factors.append(factor_name)
    return interpolatable_factors

def compute(factor_level_dic, factors):
    pass
    
def check_grid(RRs,k):
    for RR in RRs:
        assert len(RR)==k, 'The grid assumption of a Risk ratio object was not fulfilled. It was '+str(RR)
        
def sort_full_intervals(list_of_factor_type_outs):
    pass

def compute_midpoints(levels_vector):
    '''
    Given a continuous levels vector [factor_level1, factor_level2, ..., factor_levelN]
    The factor_level objects will be augmented with their pseudo-bounds and midpoints. 
    '''
    
    for i,flevel in enumerate(levels_vector):
        if not flevel.hasUpperBound(): #then we are in the situation that type="y+"
            j=i-1
            while j>=0:
                if levels_vector[j].length is not None:
                    s=levels_vector[j].length
                    flevel.setUpperBound(flevel.lowerBound+s)
                    flevel.setMidPoint(flevel.lowerBound+s/2)
                    j-=1
                    break
            assert j>=0, 'no suitable length to set midpoint was found'
        if not flevel.hasLowerBound():
            j=i+1
            while j<len(levels_vector):
                if levels_vector[j].length is not None:
                    s=levels_vector[j].length
                    flevel.setLowerBound(flevel.upperBound-s)
                    flevel.setMidPoint(flevel.upperBound-s/2)
                    j+=1
                    break
            assert j<len(levels_vector), 'no suitable length to set midpoint was found'
            
            
    
    #for n, (typ, numbers) in enumerate(levs_full_sorted):

def sort_and_expand(levels_vector):
    '''this function sorts the factor levels inside the levels_vector'''
    levs_full=map(factor_level, levels_vector)
    unsorted_avgs=[f.average() for f in levs_full]
    return [x for _,x in sorted(zip(unsorted_avgs,levs_full))]

def initialize_InterpolationCorners(interpolation_levels):
    corner_dic={}
    ks_minus_1=[len(li)-1 for li in interpolation_levels]
    for v in product(*map(enumerate,interpolation_levels)):
        key= tuple((vi[0]) for vi in v)
        factor_point=[vi[1] for vi in v]
        corner_dic[key]=InterpolationCorner(factor_point,key)
    interpolationKeys=[]
    for j in product(*map(range, ks_minus_1)):
        interpolationKeys.append(j)
        corner_points_to_add=[]
        for i in range(1, 2**len(j)):
            new_tuple=tuple( j[sub_i]+1 if include else j[sub_i] for sub_i,include in enumerate(get_subset_iterator_full(i,len(j))))
            corner_points_to_add.append(corner_dic[new_tuple])
        corner_dic[j].add_OtherCorners(corner_points_to_add)
    return corner_dic, interpolationKeys

def compute_Vs(corner_dic, interpolation_keys):
    for j in interpolation_keys:
        v=corner_dic[j]
        v.computeV()
        v.invertV()
        
def compute_Hs(corner_dic):
    pass
    
def get_string_factors_sorted(reverse_order_dic, corner_dic):
    res=[]
    for i in range(len(reverse_order_dic)):
        fp=corner_dic[reverse_order_dic[i]].factor_point
        factor_l=tuple((f.string for f in fp))
        res.append(factor_l)
    return res
        

def interpolate_one(RR):
    factor_names=RR.get_FactorNames()
    factor_levels=RR.get_categories(factor_names)
    interpolatable_factors=get_interpolatable(factor_levels)
    if interpolatable_factors:
        non_interpolatable_factors=[f for f in factor_levels if f not in interpolatable_factors]
        RRs= RR.group_by(non_interpolatable_factors)
        interpolation_levels=[sort_and_expand(factor_levels[v]) for v in factor_names if v in interpolatable_factors]
        for i_levs in interpolation_levels:
            compute_midpoints(i_levs)
        k_vec=map(len, interpolation_levels)
        for r in RRs.values():
            print r
        print [[str(f) for f in il] for il in interpolation_levels], k_vec, [len(R) for R in RRs.values()]
        k=prod(k_vec)
        check_grid(RRs.values(), k)
        cd, int_keys= initialize_InterpolationCorners(interpolation_levels)
        compute_Vs(cd, int_keys)
        for a in cd.keys():
           cd[a].computeH()
        B, order_dic= fill_Bmatrix(cd, k_vec)
        reverse_order_dic={value:key for key, value in order_dic.items()}
        Bi=inv(B)
        sorted_string_factors=get_string_factors_sorted(reverse_order_dic, cd)
        set_interpolation_area_bounds(cd, int_keys, k_vec)
        res=collect_interpolated_data_frame(non_interpolatable_factors=non_interpolatable_factors,
                                            interpolated_factors=interpolatable_factors,
                                            grouped_risk_ratios=RRs,
                                            corner_dic=cd,
                                            interpolation_keys=int_keys,
                                            sorted_string_factors=sorted_string_factors,
                                            Bi=Bi,
                                            factor_tuples_to_k_index_dic=order_dic)
        return res
    else:
        return None    
            
        #tildeAs_andZs=[compute_midpoints(lev_vec) for lev_vec in interpolation_levels]
        
        
def collect_interpolated_data_frame(non_interpolatable_factors,
                                    interpolated_factors,
                                    grouped_risk_ratios,
                                    corner_dic,
                                    interpolation_keys,
                                    sorted_string_factors,
                                    Bi,
                                    factor_tuples_to_k_index_dic #also called order_dic
                                    ):
    credibility=grouped_risk_ratios[grouped_risk_ratios.keys()[0]].get_credibility()
    new_data_frame=data_frame(non_interpolatable_factors+interpolated_factors, credibility)
    for non_interpolated_factor_values, RR in grouped_risk_ratios.items():
        rs=RR.get_last_column_in_specific_order(sorted_string_factors)
        ys=Bi.dot(array(rs))
        for jvec in interpolation_keys:
            row=list(non_interpolated_factor_values)
            corner=corner_dic[jvec]
            row=row+corner.interpolation_area_encoded()
            coefficients=corner.get_coefficients(factor_tuples_to_k_index_dic, ys)
            row+=[format_coefficients(coefficients, interpolated_factors, min(rs), max(rs))]
            new_data_frame.addRow(row)
    return new_data_frame
            
def format_coefficients(coefficients, factors,minv, maxv):
    res=[]
    res.append(factors)
    formula_parts=[]
    for i in range(2**len(factors)):
        r='{:.6f}'.format(coefficients[i])
        for j,include in enumerate(get_subset_iterator_full(i,len(factors))):
            if include:
                r+='*{}'.format(factors[j])
        formula_parts.append(r)
    res.append('+'.join(formula_parts))
    res.append([minv,maxv])
    return res

def tester():
    '''Here we dont use the H and B matrix. We test with the interpolation regardless'''
    xfacts=['0-2','2+','0']
    yfacts=['-3','3-5','5+']
    x=sort_and_expand(xfacts)
    y=sort_and_expand(yfacts)
    print [str(f) for f in x]
    print [str(f) for f in y]
    compute_midpoints(x)
    compute_midpoints(y)
    print ''
    print [str(f) for f in x]
    print [str(f) for f in y]
    corner_dic={
        (0,0): InterpolationCorner([x[0],y[0]],(0,0)),
        (0,1): InterpolationCorner([x[0],y[1]],(0,1)),
        (0,2): InterpolationCorner([x[0],y[2]],(0,2)),
        (1,0): InterpolationCorner([x[1],y[0]],(1,0)),
        (1,1): InterpolationCorner([x[1],y[1]],(1,1)),
        (1,2): InterpolationCorner([x[1],y[2]],(1,2)),
        (2,0): InterpolationCorner([x[2],y[0]],(2,0)),
        (2,1): InterpolationCorner([x[2],y[1]],(2,1)),
        (2,2): InterpolationCorner([x[2],y[2]],(2,2)),
        }
    corner_dic[(0,0)].add_OtherCorners([corner_dic[(1,0)], 
                                        corner_dic[(0,1)], 
                                        corner_dic[(1,1)]])
    corner_dic[(1,0)].add_OtherCorners([corner_dic[(2,0)], 
                                    corner_dic[(1,1)], 
                                    corner_dic[(2,1)]])
    corner_dic[(0,1)].add_OtherCorners([corner_dic[(1,1)], 
                                    corner_dic[(0,2)], 
                                    corner_dic[(1,2)]])
    corner_dic[(1,1)].add_OtherCorners([corner_dic[(2,1)], 
                                corner_dic[(1,2)], 
                                corner_dic[(2,2)]])
    for k,v in corner_dic.items():
        print k, v.str_risk_ratio_area()
        
    for j in [(0,0),(1,0),(0,1),(1,1)]:
        v=corner_dic[j]
        v.computeV()
        v.invertV()
        print v.V
        
    set_interpolation_area_bounds(corner_dic,  [(0,0),(1,0),(0,1),(1,1)], [2,2])
    
    yvals=array([1,2,1,1])
    
    for k,v in corner_dic.items():
        if k in [(0,0),(1,0),(0,1),(1,1)]:
            print k, v.str_interpolation_area()
            print v.iV.dot(yvals)
    
        
            
    
    
    
            
def compute_V(list_midpoints):
    pass

        
if __name__=='__main__':
#     j=(0,0)
#     for i in range(1, 2**len(j)):
#         print tuple( j[sub_i]+1 if include else j[sub_i] for sub_i,include in enumerate(get_subset_iterator_full(i,len(j))))
#     tester()
#     import sys
#     sys.exit()
    from risk_ratios import loadRRs
    
#     RRs=loadRRs('rr_test')
#     for i,rr in enumerate(RRs):
#         rd=interpolate_one(rr)
#         rd.save_to_file('rrd'+str(i)+'.txt')
#     
#     
#     RRs=loadRRs('../Database/Causes/Cancer/BreastCancer/rr_Gender-Oralcontraceptives')
#     for rr in RRs:
#         rd=interpolate_one(rr)
    
    RRs=loadRRs('../Database/Causes/Cancer/MouthCancer/rr_Drinking-SmokeIntensity')
    for rr in RRs:
        rd=interpolate_one(rr)
        rd.save_to_file('../Testing/rrds.txt')
        #for k, v in rd.items():
         #   print k, ':'
         #   print v
         #   print '\n'
        
        