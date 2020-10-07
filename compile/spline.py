import operator
import numpy as np

def intd(zf,zt,degrees,diffs=0):
    if diffs>degrees:
        return 0
    diff_constant=1
    for i in range(diffs):
        diff_constant*=(degrees-i)
    n=degrees+1-diffs
    ans= zt**n/n-zf**n/n
    ans*=diff_constant
    return ans

def diff_coefficients(coefficients, diffs=0):
    res=[]
    for n,c in enumerate(coefficients):
        res.append(diff_coefficient(n, diffs)*c)
    return res

    
def diff_coefficient(degree, diffs=0):
    if diffs>degree:
        return 0
    diff_constant=1
    for i in range(diffs):
        diff_constant*=(degrees-i)
    return diff_constant
    

class spline(object):
    
    '''
    This is a spline of the form:
    
    N_1(X)=1
    N_2(X)=X
    N_{k+2}(X)=d_k(X)-d_{K-1}(X)=
               [(X-x_k)^3_+ -(X-x_K)^3_+]/(x_K-x_k)-
               [[(X-x_{K-1})^3_+ -(X-x_{K})^3_+]/(x_K-x_{K-1})
    
    We rewrite everything into a sum
    
    N_k(X)= X*omega1+omega0+
            1(x_{K-1}>X>=x_k)*(gamma0+X*gamma1+X^2*gamma2+X^3*gamma3)+
            1(x_K>X>=x_{K-1})*(beta0+X*beta1+X^2*beta2+X^3*beta3)+
            1(X>=x_K)*(alpha0+X*alpha1)
            
    where the formulas for omega0,omega1,gamma0,..., beta3,alpha0,alpha1 can be found in the text
    
    '''
    
    
    def __init__(self, k, xfrom=None, xsecondlast=None, xlast=None):
        
        self.k=k
        self.xfrom=xfrom
        self.xsecondlast=xsecondlast
        self.xlast=xlast
        
        if k==1: #that is the constant spline
            self.omega0=1
            self.omega1=0
            self.initialize_constants_to_zero()
        elif k==2:
            self.omega1=1
            self.omega0=0
            self.initialize_constants_to_zero()
        else:
            self.initialize_constants(self.xfrom,
                                      self.xsecondlast,
                                      self.xlast)
            
    def is_global_spline(self):
        return self.k<3

    def initialize_constants_to_zero(self):
        
        self.beta0=self.beta1=self.beta2=self.beta3=0
        self.alpha1=self.alpha0=0
        self.gamma0=self.gamma1=0
        self.gamma2=self.gamma3=0
        
    def initialize_constants(self, xa,xb,xc):
        
        self.alpha0=(-xa**3+xc**3)/(xc-xa)- \
                     (-xb**3+xc**3)/(xc-xb)
        self.alpha1=3*(xa**2-xc**2)/(xc-xa)- \
                    3*(xb**2-xc**2)/(xc-xb)
                            
        self.beta0=-xa**3/(xc-xa)-xb**3/(xc-xa)
        self.beta1=3*xa**2/(xc-xa)-3*xb**2/(xc-xb)
        self.beta2=-3*xa/(xc-xa)-(-3)*xb/(xc-xb)
        self.beta3=1/(xc-xa)-1/(xc-xb)
        
        self.gamma0=-xa**3/(xc-xa)
        self.gamma1=3*xa**2/(xc-xa)
        self.gamma2=-3*xa/(xc-xa)
        self.gamma3=1.0/(xc-xa)
        

        
    def packed_gammas(self):
        yield self.gamma0
        yield self.gamma1
        yield self.gamma2
        yield self.gamma3
        
    def packed_betas(self):
        yield self.beta0
        yield self.beta1
        yield self.beta2
        yield self.beta3
        
    def packed_alphas(self):
        yield self.alpha0
        yield self.alpha1
    
    def integrate(self, zfrom, zto, diffs=0):
        
        if self.k==1:
            return self.omega0*self.intd(zfrom, zto, 0, diffs)
        if self.k==2:
            return self.omega1*self.intd(zfrom, zto, 1, diffs)
        gamma_area=(zfrom<self.xsecondlast) and (zto>self.xfrom)
        gamma_contrib=0
        beta_area=(zfrom<self.xlast) and (zto>self.xsecondlast)
        beta_contrib=0
        alpha_area=(zto>self.xlast)
        alpha_contrib=0
        if gamma_area:
            gamma_from=max(zfrom, self.xfrom)
            gamma_to=min(zto, self.xsecondlast)
            print(gamma_from,gamma_to)
            for i,g in enumerate(self.packed_gammas()):
                gamma_contrib+=g*intd(gamma_from,
                                      gamma_to,
                                      i,
                                      diffs)
        if beta_area:
            beta_from=max(zfrom, self.xsecondlast)
            beta_to=min(zto, self.xlast)
            for i,g in enumerate(self.packed_betas()):
                beta_contrib+=g*intd(beta_from,
                                     beta_to,
                                     i,
                                     diffs)
        if alpha_area:
            alpha_from=max(zfrom, self.xlast)
            alpha_to=zto
            for i,g in enumerate(self.packed_alphas()):
                alpha_contrib+=g*intd(alpha_from,
                                      alpha_to,
                                      i,
                                      diffs)
        return alpha_contrib+beta_contrib+gamma_contrib
    
    
    def get_coefficients_omega(self, diffs):
        res=[self.omega0, self.omega1, 0,0]
        if diffs>0:
            return diff_coefficients(res, diffs)
        return res
    
    def get_coefficients_alpha(self, diffs):
        res=[self.alpha0, self.alpha1, 0,0]
        if diffs>0:
            return diff_coefficients(res, diffs)
        return res
    
    def get_coefficients_beta(self, diffs):
        res=[self.beta0, self.beta1, self.beta2,self.beta3]
        if diffs>0:
            return diff_coefficients(res, diffs)
        return res
        
    def get_coefficients_gamma(self, diffs):
        res=[self.gamma0, self.gamma1, self.gamma2, self.gamma3]
        if diffs>0:
            return diff_coefficients(res, diffs)
        return res
    
    def get_coefficients(self, diffs, z):
        if self.is_global_spline():
            return self.get_coefficients_omega(diffs)
        if z<self.xfrom:
            return [0]*4
        if z<self.xsecondlast:
            return self.get_coefficients_gamma(diffs)
        if z<self.xlast:
            return self.get_coefficients_beta(diffs)
        return self.get_coefficients_alpha(diffs)
        

def join_coefficients(l1,l2):
    res=[0]*(len(l1)+len(l2))
    for i,c1 in enumerate(l1):
        for j,c2 in enumerate(l2):
            res[i+j]+=c1*c2
    return res

def numerically_zero(number):
    if number<1e-8 and number>-1e-8:
        return True
    else:
        return False
        
def integral_of_product(spline_1, spline_2, zfrom, zto, diffs1=0, diffs2=0):
    #we find the points where the knots are
    knots=[]
    if not spline_1.is_global_spline():
        knots.append(spline_1.xfrom)
        knots.append(spline_1.xsecondlast)
        knots.append(spline_1.xlast)
    if not spline_2.is_global_spline():
        knots.append(spline_2.xfrom)
        if spline_1.is_global_spline():
            knots.append(spline_2.xsecondlast)
            knots.append(spline_2.xlast)
    if spline_1.is_global_spline() and spline_2.is_global_spline():
        knots.extend([zfrom,zto])
    knots.sort()
    print("knots: "+' '.join(map(str,knots)))
    integral_value=0
    for knot_from, knot_to in zip(knots[:-1], knots[1:]):
        if zfrom < knot_to and zto>knot_from:
            knot_avg=float(knot_from+knot_to)/2.0
            xfrom=max(zfrom, knot_from)
            xto=min(zto, knot_to)
            print('xfrom',xfrom)
            print('xto',xto)
            s1_coefficients=spline_1.get_coefficients(diffs1, knot_avg)
            s2_coefficients=spline_2.get_coefficients(diffs2, knot_avg)
            joint_coefficients=join_coefficients(s1_coefficients,
                                                 s2_coefficients)
            print("joint_coefficients: "+' '.join(map(str,joint_coefficients)))
            for n,c in enumerate(joint_coefficients):
                if not numerically_zero(c):
                    print('computing {c}*intd({xfrom},{xto},{n},0)'.format(c=str(c),
                                                                         xfrom=str(xfrom),
                                                                         xto=str(xto),
                                                                         n=str(n)))
                    integral_value+=c*intd(float(xfrom),
                                           float(xto),
                                           n,
                                           0)
    return integral_value

def compute_number_of_parameters(ks):
    list_of_segment_sizes=[1] # the parameter for the constant.
    for i,k in enumerate(ks):
        list_of_segment_sizes.append(k-1)
    for j,k in enumerate(ks):
        for i,k2 in enumerate(ks):
            if i>j:
                list_of_segment_sizes.append((k-1)*(k2-1))
    return list_of_segment_sizes
        
    

class spline_system(object):
    
    def __init__(self, list_of_knots, normalization=True):
        '''
        The input list_of_knots is a list of lists of numbers, where each list corresponds to one direction
        '''
        self.list_of_knots=list_of_knots
        if normalization:
            self.list_of_original_knots=list_of_knots
            self.list_of_knots=self.normalize_knots(list_of_knots)
        self.Nseries=[]
        self.N=len(list_of_knots)
        self.Ks=[]
        for knot_series in self.list_of_knots:
            Nserie=[]
            Nserie.append(spline(1))
            Nserie.append(spline(2))
            second_last_knot=knot_series[-2]
            last_knot=knot_series[-1]
            for k,knot in enumerate(knot_series[:-2]):
                s=spline(k+2,knot,second_last_knot, last_knot)
                Nserie.append(s)
            self.Nseries.append(Nserie)
            self.Ks.append(len(Nserie))
        self.segment_sizes=compute_number_of_parameters(self.Ks)
        self.no_betas=sum(self.segment_sizes)
            
    def normalize_knots(self, list_of_knots):
        res=[]
        self.normalizations=[]
        for knot_series in list_of_knots:
            Nserie=[]
            last_knot=knot_series[-1]
            first_knot=knot_series[0]
            self.normalizations.append((-first_knot, 1.0/(last_knot-first_knot)))
            for k in knot_series:
                Nserie.append(float(k-first_knot)/(last_knot-first_knot))
            res.append(Nserie)
        return(res)
    
    
    
    def Wfunction(self, k1,l1,k2,l2,diff11,diff12,diff21,diff22,j1,i1,j2,i2):
        unique_js=list(set([j1,i1,j2,i2]))
        r=[(k1,diff11,j1),
           (l1,diff12,i1),
           (k2,diff21,j2),
           (l2,diff22,i2)]
        res=1
        for j_unique in unique_js:
            if j_unique>0:
                ks=[]
                diffs=[]
                for kl,diff,j in r:
                    if j==j_unique:
                        ks.apend(kl)
                        diffs.append(diff)
                assert len(ks)<3 and len(ks>0), 'wrong number of matching indexes in the integral'
                if len(ks)==2:
                    spline_1=self.Nseries[j_unique-1][ks[0]-1]
                    spline_2=self.Nseries[j_unique-1][ks[1]-1]
                    r=integral_of_product(spline_1, spline_2, 0, 1, diffs[0], diffs[1])
                    res*=r
                elif len(ks)==1:
                    spline_0=self.Nseries[j_unique-1][ks[0]-1]
                    r=spline_0.integrate(0,1,diffs[0])
                    res*=r
        return res
    
    def multiindex_to_index(self, j, i, k, l):
        '''
        Computes the index based on the combination of the Nseries j spline number k, Nseries i spline number l
        j=0 corresponds to the non-occurence of a Nseries
        '''
        if j==0:
            n=sum(self.segment_sizes[:i])
            n+=l-2
        else:
            n=sum(self.segment_sizes[:self.N]) # sums all the single series splines
            n+=sum(self.segment_sizes[self.N:((j-1)*self.N+(i-1))])
            n+=(k-2)*(self.Ks[i-1]-1)+l-2
        return n
        
            
            
        
        

    def create_W_matrix(self):
        '''
        Computes the penalty matrix for all the coefficients. The input
        '''
        self.W=np.zeros((self.no_betas, self.no_betas))
        
        for j1 in range(self.N+1): #row
            for i1 in range(j1+1, self.N+1): #row
                for j2 in range(j1,self.N+1): #column
                    for i2 in range(max(j2+1,i1), self.N+1): #column
                        if j1>0:
                            for k1 in range(2,self.Ks[j1-1]+1): #row
                                for l1 in range(2,self.Ks[i1-1]+1): #row
                                    for k2 in range(k1,self.Ks[j2-1]+1): #column
                                        if k1==k2 and j1==j2 and i1==i2:
                                            l2start=l1
                                        else:
                                            l2start=2
                                        for l2 in range(l2start,self.Ks[i2-1]+1):
                                            n1=self.multiindex_to_index(j1, i1, k1, l1)
                                            n2=self.multiindex_to_index(j2, i2, k2, l2)
                                            print('n1,n2={n1},{n2}'.format(n1=str(n1), n2=str(n2)))
                                            print('1: ({j1},{i1},{k1},{l1}):{n1}'.format(j1=str(j1),
                                                                                         i1=str(i1),
                                                                                         k1=str(k1),
                                                                                         l1=str(l1),
                                                                                         n1=str(n1)))
                                            print('2: ({j2},{i2},{k2},{l2}):{n2}'.format(j2=str(j2),
                                                                                         i2=str(i2),
                                                                                         k2=str(k2),
                                                                                         l2=str(l2),
                                                                                         n2=str(n2)))
                                            if j1==j2 and i1==i2: #case (1)
                                                pass
                        elif j2>0:
                            for l1 in range(2,self.Ks[i1-1]+1): #row
                                for k2 in range(2,self.Ks[j2-1]+1): #column
                                    for l2 in range(2,self.Ks[i2-1]+1):
                                        n1=self.multiindex_to_index(j1, i1, None, l1)
                                        n2=self.multiindex_to_index(j2, i2, k2, l2)
                                        print('n1,n2={n1},{n2}'.format(n1=str(n1), n2=str(n2)))
                                        print('1: ({j1},{i1},{k1},{l1}):{n1}'.format(j1=str(j1),
                                                                                     i1=str(i1),
                                                                                     k1=str("None"),
                                                                                     l1=str(l1),
                                                                                     n1=str(n1)))
                                        print('2: ({j2},{i2},{k2},{l2}):{n2}'.format(j2=str(j2),
                                                                                     i2=str(i2),
                                                                                     k2=str(k2),
                                                                                     l2=str(l2),
                                                                                     n2=str(n2)))
                        else:
                            for l1 in range(2,self.Ks[i1-1]+1): #row
                                for l2 in range(l1,self.Ks[i2-1]+1):
                                    n1=self.multiindex_to_index(j1, i1, None, l1)
                                    n2=self.multiindex_to_index(j2, i2, None, l2)
                                    print('n1,n2={n1},{n2}'.format(n1=str(n1), n2=str(n2)))
                                    print('1: ({j1},{i1},{k1},{l1}):{n1}'.format(j1=str(j1),
                                                                                 i1=str(i1),
                                                                                 k1=str("None"),
                                                                                 l1=str(l1),
                                                                                 n1=str(n1)))
                                    print('2: ({j2},{i2},{k2},{l2}):{n2}'.format(j2=str(j2),
                                                                                 i2=str(i2),
                                                                                 k2=str("None"),
                                                                                 l2=str(l2),
                                                                                 n2=str(n2)))
                            
                                        
                                        
                                            
            
            
    
    
    

if __name__=='__main__':
    s1=spline(4,1,5,6)
    s2=spline(3,0,5,6)
    print integral_of_product(s1,s2,0,2)
    all_knots=[[0,4.1,5],
               [5.5,6,7.6,8],
               range(6)]
    ss=spline_system(all_knots)
    ss.create_W_matrix()