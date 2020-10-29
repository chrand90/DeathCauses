import operator
import numpy as np
np.set_printoptions(threshold=100000)
import itertools
import random

def intd(zf, zt, degrees, diffs=0):
    if diffs > degrees:
        return 0
    diff_constant = 1
    for i in range(diffs):
        diff_constant *= (degrees - i)
    n = degrees + 1 - diffs
    ans = zt ** n / n - zf ** n / n
    ans *= diff_constant
    return ans

def size_of_interval(z_int):
    if len(z_int) == 1:
        return 1.0
    else:
        return z_int[1]-z_int[0]


def diff_coefficients(coefficients, diffs=0):
    res = [0]*len(coefficients)
    for n, c in enumerate(coefficients):
        if diffs<=n:
            ncoef=diff_coefficient(n, diffs) * c
            res[n-diffs]+=ncoef
    return res


def diff_coefficient(degree, diffs=0):
    if diffs > degree:
        return 0
    diff_constant = 1
    for i in range(diffs):
        diff_constant *= (degree - i)
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

        self.k = k
        self.xfrom = xfrom
        self.xsecondlast = xsecondlast
        self.xlast = xlast

        if k == 1:  # that is the constant spline
            self.omega0 = 1
            self.omega1 = 0
            self.initialize_constants_to_zero()
        elif k == 2:
            self.omega1 = 1
            self.omega0 = 0
            self.initialize_constants_to_zero()
        else:
            self.initialize_constants(self.xfrom,
                                      self.xsecondlast,
                                      self.xlast)

    def __call__(self, x):
        coefs=self.get_coefficients(0,x)
        res=0.0
        for n,b in enumerate(coefs):
            res+=b*x**n
        return res

    def is_global_spline(self):
        return self.k < 3

    def initialize_constants_to_zero(self):

        self.beta0 = self.beta1 = self.beta2 = self.beta3 = 0
        self.alpha1 = self.alpha0 = 0
        self.gamma0 = self.gamma1 = 0
        self.gamma2 = self.gamma3 = 0

    def initialize_constants(self, xa, xb, xc):

        self.alpha0 = (-xa ** 3 + xc ** 3) / (xc - xa) - \
                      (-xb ** 3 + xc ** 3) / (xc - xb)
        self.alpha1 = 3 * (xa ** 2 - xc ** 2) / (xc - xa) - \
                      3 * (xb ** 2 - xc ** 2) / (xc - xb)

        self.beta0 = -xa ** 3 / (xc - xa) - - xb ** 3 / (xc - xb)
        self.beta1 = 3 * xa ** 2 / (xc - xa) - 3 * xb ** 2 / (xc - xb)
        self.beta2 = -3 * xa / (xc - xa) - (-3) * xb / (xc - xb)
        self.beta3 = 1 / (xc - xa) - 1 / (xc - xb)

        self.gamma0 = -xa ** 3 / (xc - xa)
        self.gamma1 = 3 * xa ** 2 / (xc - xa)
        self.gamma2 = -3 * xa / (xc - xa)
        self.gamma3 = 1.0 / (xc - xa)

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

    def int_or_evaluate(self, zint):
        if len(zint)==1:
            return self.__call__(zint[0])
        else:
            return self.integrate(zint[0], zint[1])

    def custom_printer(self, dim_string=''):
        if self.k==1:
            return 'N_1(X_{d})'.format(d=dim_string)
        if self.k==2:
            return 'N_2(X_{d})'.format(d=dim_string)
        else:
            return "N_{k}(X_{d}; {xf})".format(xf=str(self.xfrom), k=str(self.k), d=dim_string)

    def integrate(self, zfrom, zto, diffs=0):

        if self.k == 1:
            return self.omega0 * intd(zfrom, zto, 0, diffs)
        if self.k == 2:
            return self.omega1 * intd(zfrom, zto, 1, diffs)
        gamma_area = (zfrom < self.xsecondlast) and (zto > self.xfrom)
        gamma_contrib = 0
        beta_area = (zfrom < self.xlast) and (zto > self.xsecondlast)
        beta_contrib = 0
        alpha_area = (zto > self.xlast)
        alpha_contrib = 0
        if gamma_area:
            gamma_from = max(zfrom, self.xfrom)
            gamma_to = min(zto, self.xsecondlast)
            #print(gamma_from, gamma_to)
            for i, g in enumerate(self.packed_gammas()):
                gamma_contrib += g * intd(gamma_from,
                                          gamma_to,
                                          i,
                                          diffs)
        if beta_area:
            beta_from = max(zfrom, self.xsecondlast)
            beta_to = min(zto, self.xlast)
            for i, g in enumerate(self.packed_betas()):
                beta_contrib += g * intd(beta_from,
                                         beta_to,
                                         i,
                                         diffs)
        if alpha_area:
            alpha_from = max(zfrom, self.xlast)
            alpha_to = zto
            for i, g in enumerate(self.packed_alphas()):
                alpha_contrib += g * intd(alpha_from,
                                          alpha_to,
                                          i,
                                          diffs)
        return alpha_contrib + beta_contrib + gamma_contrib

    def get_coefficients_omega(self, diffs):
        res = [self.omega0, self.omega1, 0, 0]
        if diffs > 0:
            return diff_coefficients(res, diffs)
        return res

    def get_coefficients_alpha(self, diffs):
        res = [self.alpha0, self.alpha1, 0, 0]
        if diffs > 0:
            return diff_coefficients(res, diffs)
        return res

    def get_coefficients_beta(self, diffs):
        res = [self.beta0, self.beta1, self.beta2, self.beta3]
        if diffs > 0:
            return diff_coefficients(res, diffs)
        return res

    def get_coefficients_gamma(self, diffs):
        res = [self.gamma0, self.gamma1, self.gamma2, self.gamma3]
        if diffs > 0:
            return diff_coefficients(res, diffs)
        return res

    def get_coefficients(self, diffs, z):
        if self.is_global_spline():
            return self.get_coefficients_omega(diffs)
        if z < self.xfrom:
            return [0] * 4
        if z < self.xsecondlast:
            return self.get_coefficients_gamma(diffs)
        if z < self.xlast:
            return self.get_coefficients_beta(diffs)
        return self.get_coefficients_alpha(diffs)


def join_coefficients(l1, l2):
    res = [0] * (len(l1) + len(l2))
    for i, c1 in enumerate(l1):
        for j, c2 in enumerate(l2):
            res[i + j] += c1 * c2
    return res


def numerically_zero(number):
    if -1e-8 < number < 1e-8:
        return True
    else:
        return False


def integral_of_product(spline_1, spline_2, zfrom, zto, diffs1=0, diffs2=0):
    # we find the points where the knots are
    knots = []
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
        knots.extend([zfrom, zto])
    knots.sort()
    #print("knots: " + ' '.join(map(str, knots)))
    integral_value = 0
    for knot_from, knot_to in zip(knots[:-1], knots[1:]):
        if zfrom < knot_to and zto > knot_from:
            knot_avg = float(knot_from + knot_to) / 2.0
            xfrom = max(zfrom, knot_from)
            xto = min(zto, knot_to)
            #rint('xfrom', xfrom)
            #print('xto', xto)
            s1_coefficients = spline_1.get_coefficients(diffs1, knot_avg)
            s2_coefficients = spline_2.get_coefficients(diffs2, knot_avg)
            joint_coefficients = join_coefficients(s1_coefficients,
                                                   s2_coefficients)
            #print("joint_coefficients: " + ' '.join(map(str, joint_coefficients)))
            for n, c in enumerate(joint_coefficients):
                if not numerically_zero(c):
                    # print('computing {c}*intd({xfrom},{xto},{n},0)'.format(c=str(c),
                    #                                                        xfrom=str(xfrom),
                    #                                                        xto=str(xto),
                    #                                                        n=str(n)))
                    integral_value += c * intd(float(xfrom),
                                               float(xto),
                                               n,
                                               0)
    return integral_value


def compute_number_of_parameters(ks):
    list_of_segment_sizes = [1]  # the parameter for the constant.
    for i, k in enumerate(ks):
        list_of_segment_sizes.append(k - 1)
    for j, k in enumerate(ks):
        for i, k2 in enumerate(ks):
            if i > j:
                list_of_segment_sizes.append((k - 1) * (k2 - 1))
    return list_of_segment_sizes

class lim_object(object):

    def __init__(self, lim_int):
        if isinstance(lim_int, list) and len(lim_int)==2:
            self.interval=True
            self.lims=lim_int
        elif isinstance(lim_int, list):
            self.interval=False
            self.value=lim_int[0]
        else:
            self.interval=True
            self.value=lim_int

    def isInterval(self):
        return self.interval

    def midPoint(self):
        if self.interval:
            return (self.lims[0]+self.lims[1])/2.0
        else:
            return self.value


def update_coefs_based_on_normalization_constants(coefs, normalizations):
    """
    The formula is alpha_0+alpha_1*((x+n1)*n2)^1+alpha_2*((x+n1)*n2)^2+alpha_3*((x+n1)*n3)^3
    and we want to isolate x, x^2 and x^3. It becomes
    alpha_0+n1*n2*alpha_1+alpha_1*n2*x+
        alpha_2*n2^2* (x^2+2*n1*x+n1^2)+
        alpha_3*n2^3* (x+n1)*(x^2+2*n1*x+n1^2) =
    alpha_0+n1*n2*alpha_1+alpha_2*n2^2*n1^2+
        (alpha_1*n2+alpha_2*n2^2*2*n1)*x+
        alpha_2*n2^2 * x^2+ 
        alpha_3*n2^3* (x^3+2*n1*x^2+n1^2*x+x^2*n1+2*n1^2*x+n1^3) =
    alpha_0+n1*n2*alpha_1+alpha_2*n2^2*n1^2+
        (alpha_1*n2+alpha_2*n2^2*2*n1)*x+
        alpha_2*n2^2 * x^2+ 
        alpha_3*n2^3* (x^3+3*n1*x^2+3*n1^2*x+n1^3) =
    alpha_0  +  n1*n2*alpha_1  +  alpha_2*n2^2*n1^2  +  alpha_3*n2^3*n1^3 +
        (alpha_1*n2  +  alpha_2*n2^2*2*n1  +  alpha_3*n2^3*(3*n1^2)  )* x + 
        (alpha_2*n2^2  +  alpha_3*n2^3*(3*n1)  )* x^2 + 
        alpha_3*n2^3)* x^3
        
    
    :param coefs: list of 4 coefficients
    :param normalizations: the translation and multiplication coefficient
    :return: a list of 4 coefficients adjusted for the normalization.
    """
    n1=normalizations[0]
    n2=normalizations[1]
    res=[
        coefs[0]  +  coefs[1]*n1*n2  +  coefs[2]*n1**2*n2**2  +  coefs[3]*n1**3*n2**3,
        coefs[1]*n2  +  coefs[2]*n2**2*2*n1  +  coefs[3]*n2**3*(3*n1**2),
        coefs[2]*n2**2  +  coefs[3]*n2**3*(3*n1),
        coefs[3]*n2**3
    ]
    return res


class spline_system(object):

    def __init__(self, list_of_knots, normalization=True):
        '''
        The input list_of_knots is a list of lists of numbers, where each list corresponds to one direction
        '''
        self.list_of_knots = list_of_knots
        if normalization:
            self.list_of_original_knots = list_of_knots
            self.list_of_knots = self.normalize_knots(list_of_knots)
        self.Nseries = []
        self.N = len(list_of_knots)
        self.Ks = []
        for knot_series in self.list_of_knots:
            Nserie = []
            Nserie.append(spline(1))
            Nserie.append(spline(2))
            second_last_knot = knot_series[-2]
            last_knot = knot_series[-1]
            for k, knot in enumerate(knot_series[:-2]):
                s = spline(k + 3, knot, second_last_knot, last_knot)
                Nserie.append(s)
            self.Nseries.append(Nserie)
            self.Ks.append(len(Nserie))
        self.segment_sizes = compute_number_of_parameters(self.Ks)
        self.no_betas = sum(self.segment_sizes)

    def custom_print(self):
        r = "{N}-dimensional spline system with base splines:\n".format(N=str(self.N))
        for n,Nserie in enumerate(self.Nseries):
            bstr = ', '.join([s.custom_printer(n+1) for s in Nserie[1:]])+'\n'
            r += bstr
        return r

    def spline_val(self, betas, xs, normalize=True):
        if normalize:
            xs=self.normalize_lims(xs)

        ans = betas[0]
        beta_counter=1
        for x, spline_list in zip(xs, self.Nseries):
            for spline_f in spline_list[1:]:
                ans+=spline_f(x)*betas[beta_counter]
                beta_counter+=1

        for n, (x1, spline_list1) in enumerate(zip(xs, self.Nseries)):
            for m, (x2, spline_list2) in enumerate(zip(xs, self.Nseries)):
                if m > n:
                    for spline1 in spline_list1[1:]:
                        for spline2 in spline_list2[1:]:
                            ans+=spline1(x1)*spline2(x2)*betas[beta_counter]
                            beta_counter+=1
        return ans

    def formula(self, lims, betas, normalize=True):
        """
        creates a formula for the spline system in the factor level lims.

        :returns string encoding the formula
        :parameter lims, the list of factor limits,
                    betas, the list of estimated beta values
        """
        if normalize:
            lims=self.normalize_lims(lims)
        lim_obs=[lim_object(lim) for lim in lims]
        formula_dic={():betas[0]}
        formula_dic.update({(i,k+1):0 for i in range(self.N) for k in range(3)})
        extra_dic={(i,j,k+1,l+1):0 for k in range(3) for l in range(3) for i in range(self.N) for j in range(self.N) if j>i}
        formula_dic.update(extra_dic)

        beta_counter = 1
        for n, (lim_obj, spline_list, normalization) in enumerate(zip(lim_obs, self.Nseries, self.normalizations)):
            for spline_f in spline_list[1:]:
                z = lim_obj.midPoint()
                coefs = spline_f.get_coefficients(0, z)
                coefs = update_coefs_based_on_normalization_constants(coefs, normalization)
                if lim_obj.isInterval():
                    distribute_to_coef_to_formula_dic(formula_dic,coefs, n, C=betas[beta_counter])
                else:
                    formula_dic[()]+=evaluate_polynomial(coefs,z,normalization)
                beta_counter+=1


        for n, (lim_obj1, spline_list1, normalization1) in enumerate(zip(lim_obs, self.Nseries, self.normalizations)):
            for m, (lim_obj2, spline_list2, normalization2) in enumerate(zip(lim_obs, self.Nseries, self.normalizations)):
                if m > n:
                    for spline1 in spline_list1[1:]:
                        for spline2 in spline_list2[1:]:
                            z1 = lim_obj1.midPoint()
                            coefs1 = spline1.get_coefficients(0, z1)
                            coefs1 = update_coefs_based_on_normalization_constants(coefs1, normalization1)
                            z2 = lim_obj2.midPoint()
                            coefs2 = spline2.get_coefficients(0, z2)
                            coefs2 = update_coefs_based_on_normalization_constants(coefs2, normalization2)
                            if lim_obj1.isInterval() and lim_obj2.isInterval():
                                distribute_to_coef_pair_to_formula_dic(formula_dic, coefs1, coefs2, n, m,
                                                                       C=betas[beta_counter])
                            elif lim_obj1.isInterval():
                                eval2=evaluate_polynomial(coefs2, z2, normalization2)
                                distribute_to_coef_to_formula_dic(formula_dic, coefs1, n, C=betas[beta_counter]*eval2)
                            elif lim_obj2.isInterval():
                                eval1=evaluate_polynomial(coefs1, z1, normalization1)
                                distribute_to_coef_to_formula_dic(formula_dic, coefs2, m, C=betas[beta_counter]*eval1)
                            else:
                                eval1 = evaluate_polynomial(coefs1, z1, normalization1)
                                eval2 = evaluate_polynomial(coefs2, z2, normalization2)
                                formula_dic[()] += eval1*eval2
                            beta_counter+=1

        return stringify_formula_dic(formula_dic)




    def normalize_knots(self, list_of_knots):
        res = []
        self.normalizations = []
        for knot_series in list_of_knots:
            Nserie = []
            last_knot = knot_series[-1]
            first_knot = knot_series[0]
            self.normalizations.append((-first_knot, 1.0 / (last_knot - first_knot)))
            for k in knot_series:
                Nserie.append(float(k - first_knot) / (last_knot - first_knot))
            res.append(Nserie)
        return (res)

    def Wfunction(self, k1, l1, k2, l2, diff11, diff12, diff21, diff22, j1, i1, j2, i2):
        unique_js = list(set([j1, i1, j2, i2]))
        r = [(k1, diff11, j1),
             (l1, diff12, i1),
             (k2, diff21, j2),
             (l2, diff22, i2)]
        res = 1
        for j_unique in unique_js:
            if j_unique > 0:
                ks = []
                diffs = []
                for kl, diff, j in r:
                    if j == j_unique:
                        ks.append(kl)
                        diffs.append(diff)
                assert len(ks) < 3 and len(ks)>0, 'wrong number of matching indexes in the integral'
                if len(ks) == 2:
                    spline_1 = self.Nseries[j_unique - 1][ks[0] - 1]
                    spline_2 = self.Nseries[j_unique - 1][ks[1] - 1]
                    rv = integral_of_product(spline_1, spline_2, 0, 1, diffs[0], diffs[1])
                    res *= rv
                elif len(ks) == 1:
                    spline_0 = self.Nseries[j_unique - 1][ks[0] - 1]
                    rv = spline_0.integrate(0, 1, diffs[0])
                    res *= rv
        # print("W({k1},{l1},{k2},{l2},{diff11},{diff12},{diff21},{diff22},{j1},{i1},{j2},{i2})={res}".format(k1=str(k1),
        #                                                                                                     l1=str(l1),
        #                                                                                                     k2=str(k2),
        #                                                                                                     l2=str(l2),
        #                                                                                                     diff12=str(diff12),
        #                                                                                                     diff11=str(diff11),
        #                                                                                                     diff21=str(diff21),
        #                                                                                                     diff22=str(diff22),
        #                                                                                                     j1=str(j1),
        #                                                                                                     i1=str(i1),
        #                                                                                                     j2=str(j2),
        #                                                                                                     i2=str(i2),
        #                                                                                                     res=str(res)))
        return res
    
    def segments_visited_before(self, j,i):
        if j==0:
            return 1+(i-1) # the neutral step plus all the i-1 previous segments.
        else:
            ans= 1+ (self.N) # the neutral step plus of the combinations j,i=(0,1),(0,2), ..., (0,N)
            for jbefore in range(1,j):
                ans+=self.N-jbefore
            ans+=(i-1-j)
            return ans
            

    def multiindex_to_index(self, j, i, k, l):
        '''
        Computes the index based on the combination of the Nseries j spline number k, Nseries i spline number l
        j=0 corresponds to the non-occurence of a Nseries
        '''
        if j == 0:
            n = sum(self.segment_sizes[:i])
            n += l - 2
        else:
            n = sum(self.segment_sizes[:(self.segments_visited_before(j, i))])
            n += (k - 2) * (self.Ks[i - 1] - 1) + l - 2
        return n

    def create_W_matrix(self):
        '''
        Computes the penalty matrix for all the coefficients. The input
        '''
        self.W = np.zeros((self.no_betas, self.no_betas))

        for j1 in range(self.N + 1):  # row
            for i1 in range(j1 + 1, self.N + 1):  # row
                for j2 in range(j1, self.N + 1):  # column
                    i2start= (j2+1)*(j2>j1)+i1*(j2==j1)
                    for i2 in range(i2start, self.N + 1):  # column
                        if j1 > 0: #implies j2>0
                            for k1 in range(2, self.Ks[j1 - 1] + 1):  # row
                                for l1 in range(2, self.Ks[i1 - 1] + 1):  # row
                                    if j1==j2 and i1==i2:
                                        k2start=k1
                                    else:
                                        k2start=2
                                    for k2 in range(k2start, self.Ks[j2 - 1] + 1):  # column
                                        if k1 == k2 and j1 == j2 and i1 == i2:
                                            l2start = l1
                                        else:
                                            l2start = 2
                                        for l2 in range(l2start, self.Ks[i2 - 1] + 1):
                                            n1 = self.multiindex_to_index(j1, i1, k1, l1)
                                            n2 = self.multiindex_to_index(j2, i2, k2, l2)
#                                             print('n1,n2={n1},{n2}'.format(n1=str(n1), n2=str(n2)))
#                                             print('1: ({j1},{i1},{k1},{l1}):{n1}'.format(j1=str(j1),
#                                                                                          i1=str(i1),
#                                                                                          k1=str(k1),
#                                                                                          l1=str(l1),
#                                                                                          n1=str(n1)))
#                                             print('2: ({j2},{i2},{k2},{l2}):{n2}'.format(j2=str(j2),
#                                                                                          i2=str(i2),
#                                                                                          k2=str(k2),
#                                                                                          l2=str(l2),
#                                                                                          n2=str(n2)))
                                            if j1 == j2:  # case (4)
                                                self.W[n1,n2]+=self.Wfunction(k1,l1,k2,l2,2,0,2,0,j1,i1,j2,i2)
                                            if j1==j2 and i1==i2: #case (0)
                                                self.W[n1, n2] += self.Wfunction(k1, l1, k2, l2, 1, 1, 1, 1, j1, i1, j2,i2)
                                            if i1==i2: #case (6)
                                                self.W[n1, n2] += self.Wfunction(k1, l1, k2, l2, 0, 2, 0, 2, j1, i1, j2, i2)

                                            if j2 == i1: #case (5)
                                                self.W[n1,n2]+=self.Wfunction(k1, l1, k2, l2, 0, 2, 2, 0, j1, i1, j2, i2)
                        elif j2 > 0: #which implies j1==0 due to the previous if-statement.
                            for l1 in range(2, self.Ks[i1 - 1] + 1):  # row
                                for k2 in range(2, self.Ks[j2 - 1] + 1):  # column
                                    if j1 == j2 and i1 == i2:
                                        l2start = l1
                                    else:
                                        l2start = 2
                                    for l2 in range(l2start, self.Ks[i2 - 1] + 1):
                                        n1 = self.multiindex_to_index(j1, i1, None, l1)
                                        n2 = self.multiindex_to_index(j2, i2, k2, l2)
#                                         print('n1,n2={n1},{n2}'.format(n1=str(n1), n2=str(n2)))
#                                         print('1: ({j1},{i1},{k1},{l1}):{n1}'.format(j1=str(j1),
#                                                                                      i1=str(i1),
#                                                                                      k1=str("None"),
#                                                                                      l1=str(l1),
#                                                                                      n1=str(n1)))
#                                         print('2: ({j2},{i2},{k2},{l2}):{n2}'.format(j2=str(j2),
#                                                                                      i2=str(i2),
#                                                                                      k2=str(k2),
#                                                                                      l2=str(l2),
#                                                                                      n2=str(n2)))
                                        if i1 == j2:  # case (2)
                                            self.W[n1, n2] += self.Wfunction(None, l1, k2, l2, None, 2, 2, 0, j1, i1, j2, i2)
                                        if i1 == i2:  # case (3)
                                            self.W[n1, n2] += self.Wfunction(None, l1, k2, l2, None, 2, 0, 2, j1, i1, j2,  i2)
                        else: #j1==0 and j2==0
                            for l1 in range(2, self.Ks[i1 - 1] + 1):  # row
                                if j1 == j2 and i1 == i2:
                                    l2start = l1
                                else:
                                    l2start = 2
                                for l2 in range(l2start, self.Ks[i2 - 1] + 1):
                                    n1 = self.multiindex_to_index(j1, i1, None, l1)
                                    n2 = self.multiindex_to_index(j2, i2, None, l2)
                                    # print('n1,n2={n1},{n2}'.format(n1=str(n1), n2=str(n2)))
                                    # print('1: ({j1},{i1},{k1},{l1}):{n1}'.format(j1=str(j1),
                                    #                                              i1=str(i1),
                                    #                                              k1=str("None"),
                                    #                                              l1=str(l1),
                                    #                                              n1=str(n1)))
                                    # print('2: ({j2},{i2},{k2},{l2}):{n2}'.format(j2=str(j2),
                                    #                                              i2=str(i2),
                                    #                                              k2=str("None"),
                                    #                                              l2=str(l2),
                                    #                                              n2=str(n2)))
                                    #sw=self.Wfunction(None,l1,None,l2,None,2,None,2,j1,i1,j2,i2)
                                    #print('W(l1,l2,j1,j2,i1,i2)=W({l1},{l2},{j1},{i1},{j2},{i2})={sw}'.format(l1=str(l1),
                                    #                                                                          l2=str(l2),
                                    #                                                                          j1=str(j1),
                                    #                                                                          j2=str(j2),
                                    #                                                                          i1=str(i1),
                                    #                                                                          i2=str(i2),
                                    #sw=str(sw)))
                                    if i1==i2:
                                        self.W[n1, n2] += self.Wfunction(None,l1,None,l2,None,2,None,2,j1,i1,j2,i2)
        self.fill_out_below_diagonal()

    def fill_out_below_diagonal(self):
        self.W=self.W+self.W.T-np.diagflat(self.W.diagonal())

    def normalize_lims(self, lims):
        new_lims=[]
        for lim_obj, (translation_constant, divide_constant) in zip(lims, self.normalizations):
            if isinstance(lim_obj, list):
                new_lim_obj=[]
                for v in lim_obj:
                    new_lim_obj.append(    (v + translation_constant) * divide_constant   )
                new_lims.append(new_lim_obj)
            else:
                new_lims.append( (lim_obj+translation_constant)*divide_constant )
        return new_lims

    def get_beta_row(self, lims, normalize=True):
        """
        Computes the linear combinations of betas when you integrate the spline system from and to the lims.
        Each entry is normalized according to the size of the lim-interval. If any entry of the lims list is a single
        number (instead of two numbers), it is understood as a fixed point and the integration will not be performed
        on that variable.

        :param lims: list of intervals [[xfrom_1,xto_1], ..., [xfrom_N, xto_N]]
        :return: a list of size 1+sum[K_i-1]+sum[ (K_i-1)(K_j-1) ]
        """

        #the beta_0 entry:

        if normalize:
            lims=self.normalize_lims(lims)

        ans = [1.0]
        for lim_int, spline_list in zip(lims, self.Nseries):
            for spline_f in spline_list[1:]:
                ans.append(spline_f.int_or_evaluate(lim_int)/size_of_interval(lim_int))

        for n, (lim_int1, spline_list1) in enumerate(zip(lims, self.Nseries)):
            for m, (lim_int2, spline_list2) in enumerate(zip(lims, self.Nseries)):
                if m > n:
                    for spline1 in spline_list1[1:]:
                        for spline2 in spline_list2[1:]:
                            v1 = spline1.int_or_evaluate(lim_int1)/size_of_interval(lim_int1)
                            v2 = spline2.int_or_evaluate(lim_int2)/size_of_interval(lim_int2)
                            ans.append(v1*v2)
        return ans

    def automatic_beta_rows(self, list_of_degenerates):
        """
        Computes all linear combinations of betas for the standard integrated spline system where we put in the extra
        "degenerate" observations corresponding to risk ratios where one or more of the factor levels are a single value

        :param list_of_degenerates: [[degen_11,degen_12, .., degen_1K_1], ..., [degen_N1, ... degen_NK_N]]
        :return: matrix where the rows are beta coefficients for corresponding to the different
        """
        res = []
        per_variable_lims = []
        for degens, Nserie in zip(list_of_degenerates, self.Nseries):
            intervals_for_variable = []
            knots = []
            for i, s in enumerate(Nserie):
                if i == 2: #there should be at least one
                    last_knot = s.xlast
                    second_lastknot = s.xsecondlast
                    knots.append(s.xfrom)
                    knots.append(last_knot)
                    knots.append(second_lastknot)
                elif i > 2:
                    knots.append(s.xfrom)
            knots.sort()
            for kfro, kto in zip(knots[:-1], knots[1:]):
                intervals_for_variable.append([kfro, kto])
            for d in degens:
                intervals_for_variable.append([d])
            per_variable_lims.append(intervals_for_variable)

        for t in itertools.product(*per_variable_lims):
            print(t)

def get_maximum_likelihood_estimate(W,X, yvals, lambdaval=1.0):
    X=np.array(X)
    W=np.array(W)
    y=np.array(yvals)
    return np.linalg.inv(X.T.dot(X)+lambdaval*W).dot(X.T).dot(y)

def distribute_to_coef_pair_to_formula_dic(formula_dic, coefs1, coefs2, i, j, C=1):
    for c1,power1 in zip(coefs1,range(4)):
        for c2, power2 in zip(coefs2,range(4)):
            if power1==power2==0:
                formula_dic[()]+=C*c1*c2
            elif power1==0:
                formula_dic[(j,power2)]+=C*c1*c2
            elif power2==0:
                formula_dic[(i,power1)]+=C*c1*c2
            else:
                formula_dic[(i,j,power1,power2)]+=C*c1*c2

def distribute_to_coef_to_formula_dic(formula_dic, coefs, i, C=1):
    for c1,power1 in zip(coefs,range(4)):
            if power1==0:
                formula_dic[()]+=C*c1
            else:
                formula_dic[(i,power1)]+=C*c1

def evaluate_polynomial(coefs, z, normalization):
    z=z/normalization[1]-normalization[0]
    return coefs[0]+coefs[1]*z+coefs[2]*z**2+coefs[3]*z**3

def stringify_formula_dic(fdic):
    terms=[]
    for term, coef in fdic.items():
        if not (-1e-10 < coef < 1e-10):
            if len(term)==0:
                terms.append('{c}'.format(c=str(coef)))
            elif len(term)==2:
                terms.append('{c}*x{i}^{d}'.format(i=term[0], d=term[1], c=str(coef)))
            elif len(term)==4:
                terms.append("{c}*x{i1}^{d1}*x{i2}^{d2}".format(i1=term[0], i2=term[1], d1=term[2], d2=term[3], c=str(coef)))
            else:
                assert False, 'There is a strange term'
    return '+'.join(terms)

def make_spline_system(interpolation_levels):
    knots=[]
    for series in interpolation_levels:
        added_knots=[]
        for flevel in series:
            if flevel.getType()=='x':
                continue
            elif not added_knots:
                added_knots.append(flevel.lowerBound)
                added_knots.append(flevel.upperBound)
            else:
                added_knots.append(flevel.upperBound)
        knots.append(added_knots)
    ss=spline_system(knots)
    return ss

def random_number_in_interval_or_point(interval):
    if isinstance(interval,list):
        f,t= interval[0], interval[-1]
        return random.random()*(t-f)+f
    else:
        return interval

def evaluate_formula(formula, xs):
    parts=formula.split('+')
    res=0
    for part in parts:
        add=1
        mparts=part.split('*')
        for mpart in mparts:
            if mpart.startswith('x'):
                degree = int(mpart[-1])
                index = int(mpart[1:-2])
                add *= xs[index]**degree
            else:
                add *= float(mpart)
        res+=add
    return res



def integrate_based_on_lims(ss, betas, lims, reps=10000):
    r=[]
    for _ in range(reps):
        xs=[]
        for l in lims:
            xs.append(random_number_in_interval_or_point(l))
        r.append(ss.spline_val(betas, xs))
    return sum(r)/len(r), min(r), max(r)

def get_random_point_in_lim(lims):
    xs=[]
    for l in lims:
        xs.append(random_number_in_interval_or_point(l))
    return xs

def test_interpolation():
    from risk_ratios import loadRRs
    RR = loadRRs('../Database/Causes/Cancer/MouthCancer/rr_Drinking-SmokeIntensity')[0]
    from interpolation import sort_and_expand, compute_midpoints
    factor_levels = RR.get_categories(['Drinking', 'SmokeIntensity'])
    interpolation_levels = [sort_and_expand(factor_levels['Drinking']), sort_and_expand(factor_levels['SmokeIntensity'])]
    compute_midpoints(interpolation_levels[0])
    compute_midpoints(interpolation_levels[1])


    print('Drinking')
    for l in interpolation_levels[0]:
        print('\t',l)
    print('SmokeIntensity')
    for l in interpolation_levels[1]:
        print('\t',l)
    level_dics=[
        {interpolation_level.string: interpolation_level for interpolation_level in interpolation_levels[0]},
        {interpolation_level.string: interpolation_level for interpolation_level in interpolation_levels[1]},
    ]
    print('Drinking')
    for l,v in level_dics[0].items():
        print('\t',l,':',v)
    print('SmokeIntensity')
    for l,v in level_dics[1].items():
        print('\t',l,':',v)
    ss=make_spline_system(interpolation_levels)

    print(ss.custom_print())
    ss.create_W_matrix()
    yvals=[]
    X=[]
    for facts,y in RR.get_as_list_of_lists():
        yvals.append(y)
        int_levels_for_row=[level_dics[n][fact].asFiniteInterval() for n,fact in enumerate(facts)]
        X.append(ss.get_beta_row(int_levels_for_row))
    print('X')
    for xi in X:
        print('\t',xi)
    print(RR)

    betas=get_maximum_likelihood_estimate(W=ss.W, X=X, yvals=yvals, lambdaval=0.005)
    print(betas)

    for facts,y in RR.get_as_list_of_lists():
        int_levels_for_row=[level_dics[n][fact].asFiniteInterval() for n,fact in enumerate(facts)]
        int_val, min_val, max_val=integrate_based_on_lims(ss, betas, int_levels_for_row)
        print('simulated=', int_val, '| actual', y, '({f},{t})'.format(f=min_val, t=max_val))
        form=ss.formula(int_levels_for_row, betas)
        print(form)
        z=get_random_point_in_lim(int_levels_for_row)
        print('z', str(z))
        y1=evaluate_formula(form,z)
        y2=ss.spline_val(betas, z)
        print('y1=', y1, ' | y2=', y2)


    #print(ss.W)
                                    



if __name__ == '__main__':

    test_interpolation()
    import sys
    sys.exit()
    s1 = spline(4, 1, 5, 6)
    s2 = spline(3, 0, 5, 6)
    integral_of_product(s1, s2, 0, 2)
    all_knots = [[0, 0.5, 1],
                 [0,0.33,0.67,1.0],
                 [0,0.2,0.8,1]]
    ss = spline_system(all_knots)
    #w2 = ss.Wfunction(3, 3, 3, 3, 2, 0, 2, 0, 1, 3, 1, 3)

    #test beta rows

    ss.automatic_beta_rows([[0],[0],[]])


    print(ss.Wfunction(None, 3, None, 3, 0, 2, 0, 2, 0, 2, 0, 3))

    ss.create_W_matrix()
    #print(ss.no_betas)
    #print(ss.Ks)
    #print(ss.segment_sizes)
    np.savetxt('W_matrix.txt',ss.W, fmt= "%.3f")

    betas=np.array([0,  0.6,0,  0,1,0,  0,1.1,1.6,  0,0,0,0,0,0,  0,0,0,1,0,0,  0,0,0,0,0,0,0,0.6,0])
    print(np.dot(np.dot(betas,ss.W), betas))

    import spline_unit_tests

    st=spline_unit_tests.tester(ss.list_of_knots)
    print(st.integrate_for_penalizer_faster(betas))

    sys.exit()

    #testing the case betas=[0,  0,0,  0,1,0,  0,1,0,  0,0,0,0,0,0,  0,0,0,0,0,0,  0,0,0,0,0,0,0,0,0]
    a1=st.Wpart(ks=[3], diffs=[2], j=2, exponent=2)
    a2=st.Wpart(ks=[3], diffs=[2], j=3, exponent=2)

    print('a1+a2={a1}+{a2}={r}'.format(a1=str(a1), a2=str(a2), r=str(a1+a2)))

    #entries of W.
    a11=ss.W[4,4]
    a12=ss.W[4,7]
    a21=ss.W[7,4]
    a22=ss.W[7,7]
    print('a11+a12+a21+a22= \n'
          '{a11}+{a12}+{a21}+{a22}=\n'
          '{r}'.format(a11=str(a11), a12=str(a12), a21=str(a21), a22=str(a22), r=str(a11+a12+a21+a22)))

    sys.exit()
    print("--------------------")
    a11=st.Wpart(ks=[3], diffs=[1], j=1, exponent=2)
    a12=st.Wpart(ks=[3], diffs=[1], j=3, exponent=2)
    a21=st.Wpart(ks=[3], diffs=[2], j=1, exponent=2)
    a22=st.Wpart(ks=[3], diffs=[0], j=3, exponent=2)
    a31=st.Wpart(ks=[3], diffs=[0], j=1, exponent=2)
    a32=st.Wpart(ks=[3], diffs=[2], j=3, exponent=2)
    r=a11*a12+a21*a22+a31*a32
    print('by Wparts:',r)
    print('1111:', a11*a12, a11, a12)
    print('2020:', a21*a22, a21,a22)
    print('0202:', a31*a32, a31, a32)
    #sys.exit()
    w1=ss.Wfunction(3,3,3,3, 1, 1, 1, 1, 1, 3, 1, 3)

    w2=ss.Wfunction(3,3,3,3, 2, 0, 2, 0, 1, 3, 1, 3)

    w3=ss.Wfunction(3,3,3,3, 0, 2, 0, 2, 1, 3, 1, 3)
    r=w1+w2+w3
    print("{w1}+{w2}+{w3}={r}".format(w1=str(w1),w2=str(w2),w3=str(w3), r=str(r)))

    for xi in range(39):
        x=float(xi)/37.0
        fspline1=ss.Nseries[0][2](x)
        fspline2=ss.Nseries[1][2](x)
        tspline1=st.Nseries[0][2](x)
        tspline2=st.Nseries[1][2](x)

        print('s0({x})'.format(x=str(x)),fspline1, tspline1)
        print('s1({x})'.format(x=str(x)), fspline2, tspline2)


