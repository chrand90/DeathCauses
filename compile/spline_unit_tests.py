import autograd
import autograd.numpy as anp
import scipy.integrate as scip


# import numpy as anp

def dk(x, xk, xK):
    if x <= xk:
        return 0.0
    if x <= xK:
        return (x - xk) ** 3 / (xK - xk)
    else:
        return ((x - xk) ** 3 - (x - xK) ** 3) / (xK - xk)


def spline_value(k, x, xfrom, xsecondlast, xlast):
    if k == 1:
        return 1.0
    if k == 2:
        return x
    else:
        return dk(x, xfrom, xlast) - dk(x, xsecondlast, xlast)


def create_spline_function(k, xfrom=None, xsecondlast=None, xlast=None):
    assert k <= 2 or not (xfrom is None or xsecondlast is None or xlast is None), 'Ordered illegal spline'

    def f(x):
        return spline_value(k, x, xfrom, xsecondlast, xlast)

    return f


class tester(object):

    def __init__(self, xpoints):

        self.Nseries = []
        self.mins=[]
        self.maxs=[]
        self.Ks=[]
        for xseries in xpoints:
            Nserie = []
            Nserie.append(create_spline_function(1))
            Nserie.append(create_spline_function(2))
            self.mins.append(xseries[0])
            self.maxs.append(xseries[-1])
            xlast = xseries[-1]
            xsecondlast = xseries[-2]
            for k, x in enumerate(xseries[:-2]):
                kv = k + 3
                Nserie.append(create_spline_function(kv, x, xsecondlast, xlast))
            self.Nseries.append(Nserie)
            self.Ks.append(len(xseries))

    def testf(self, x):
        return x**4

    def Wpart(self, ks, diffs, j, exponent=2, zfrom=0, zto=1):
        splines= [self.Nseries[j-1][k-1] for k in ks]
        diffsplines=[]
        for s,diff in zip(splines, diffs):
            f=s
            for _ in range(diff):
                f=autograd.grad(f)
            diffsplines.append(f)
        def h(x):
            res=1
            for f in diffsplines:
                res*=f(x)
            return res**exponent
        return scip.quad(h, zfrom, zto)[0]





    def spline_pairs(self, betas):

        list_of_tuples=[(betas[0], [], [self.Nseries[0][0]])]
        beta_counter=1
        for j,Nserie in enumerate(self.Nseries):
            for s in Nserie[1:]:
                list_of_tuples.append(
                    (betas[beta_counter],
                     [j],
                     [s])
                )
                beta_counter+=1
        for j, Nserie in enumerate(self.Nseries):
            for i, Nserie2 in enumerate(self.Nseries):
                if i>j:
                    for s1 in Nserie[1:]:
                        for s2 in Nserie2[1:]:
                            list_of_tuples.append(
                                (
                                    betas[beta_counter],
                                    [j,i],
                                    [s1,s2]
                                )
                            )
                            beta_counter += 1
        return list_of_tuples



    def total_spline(self, xs, betas):
        svals = [[s(x) for s in Nserie] for x, Nserie in zip(xs, self.Nseries)]
        # print(svals)
        res = betas[0]
        beta_counter = 1
        for sval_row in svals:
            for sval in sval_row[1:]:
                res = res + sval * betas[beta_counter]
                beta_counter += 1
                # print(res,betas[beta_counter-1],sval)

        for n, sval_row1 in enumerate(svals):
            for m, sval_row2 in enumerate(svals):
                if m > n:
                    for sval1 in sval_row1[1:]:
                        for sval2 in sval_row2[1:]:
                            res = res + betas[beta_counter] * sval1 * sval2
                            beta_counter += 1
                            # print(res,betas[beta_counter-1], sval1,sval2)
        return res

    def integrate_for_penalizer_faster(self, betas):
        sp=self.spline_pairs(betas)
        res=0
        for n1,(beta1, variables1, splines1) in enumerate(sp):
            for n2, (beta2, variables2, splines2) in enumerate(sp):
                inters=list(set(variables1) & set(variables2))
                if len(inters)>=1 and beta1!=0 and beta2!=0:
                    for intv in inters:
                        prod_res = 1
                        for var1,spline1 in zip(variables1, splines1):
                            for var2,spline2 in zip(variables2, splines2):
                                if var1==var2==intv:
                                    sss1=autograd.grad(autograd.grad(spline1))
                                    sss2=autograd.grad(autograd.grad(spline2))
                                    def f(x):
                                        return sss1(x)*sss2(x)
                                    contrib=scip.quad(f,
                                                        self.mins[intv],
                                                        self.maxs[intv])[0]
                                    #print('''int_{mi}^{ma}(N''_{k1}(X_{j})N''_{k2}(X_{j}))={r}'''.format(k1="k1",
                                    #                                                                     k2="k2",
                                    #                                                                     mi=str(self.mins[intv]),
                                    #                                                                     ma=str(self.maxs[intv]),
                                    #                                                                     j=str(intv),
                                    #                                                                     r=str(contrib)
                                    #                                                                ))
                                    prod_res*=contrib
                        for var1, spline1 in zip(variables1, splines1):
                            if var1 !=intv:
                                if var1 not in inters:
                                    contrib=scip.quad(spline1, self.mins[var1],self.maxs[var1])[0]
                                    #print('''int_{mi}^{ma}(N_{k1}(X_{j})))={r}'''.format(k1="k1",
                                    #                                                     mi=str(self.mins[
                                    #                                                                var1]),
                                    #                                                     ma=str(self.maxs[
                                    #                                                                var1]),
                                    #                                                     j=str(var1),
                                    #                                                     r=str(contrib)
                                    #                                                     ))
                                    prod_res*=contrib
                                else:
                                    for var2, spline2 in zip(variables2, splines2):
                                        if var1==var2:
                                            def f(x):
                                                return spline1(x)*spline2(x)

                                            contrib = scip.quad(f, self.mins[var1], self.maxs[var1])[0]
                                            #print('''int_{mi}^{ma}(N_{k1}(X_{j})N_{k2}(X_{j})))={r}'''.format(k1="k1",
                                            #                                                     k2='k2',
                                            #                                                     mi=str(self.mins[
                                            #                                                                var1]),
                                            #                                                     ma=str(self.maxs[
                                            #                                                                var1]),
                                            #                                                     j=str(var1),
                                            #                                                     r=str(contrib)
                                            #                                                     ))
                                            prod_res*=contrib
                        for var2, spline2 in zip(variables2, splines2):
                            if var2 != intv and var2 not in inters:
                                contrib=scip.quad(spline2, self.mins[var2], self.maxs[var2])[0]
                                #print('''int_{mi}^{ma}(N_{k1}(X_{j})))={r}'''.format(k1="k2",
                                #                                                     mi=str(self.mins[
                                #                                                                var2]),
                                #                                                     ma=str(self.maxs[
                                #                                                                var2]),
                                #                                                     j=str(var2),
                                #                                                     r=str(contrib)
                                #                                                     ))
                                prod_res *= contrib
                        res+=prod_res*beta1*beta2
                    if len(inters)==2:
                        prod_res=1
                        for var1, spline1 in zip(variables1, splines1):
                            for var2, spline2 in zip(variables2, splines2):
                                if var1 == var2:
                                    ss1 = autograd.grad(spline1)
                                    ss2 = autograd.grad(spline2)

                                    def f(x):
                                        return ss1(x) * ss2(x)

                                    contrib = scip.quad(f,
                                                        self.mins[var1],
                                                        self.maxs[var2])[0]
                                    #print('''int_{mi}^{ma}(N'_{k1}(X_{j})N'_{k2}(X_{j}))={r}'''.format(k1="k1",
                                    #                                                                     k2="k2",
                                    #                                                                     mi=str(self.mins[var1]),
                                    #                                                                     ma=str(self.maxs[var1]),
                                    #                                                                     j=str(var1),
                                    #                                                                     r=str(contrib)
                                    #                                                                ))


                                    prod_res *=contrib
                        res+= prod_res*beta1*beta2
        return res

    def integrate_for_penalizer(self, betas):
        def f(x):
            return self.total_spline(x, betas)
        h=autograd.hessian(f)
        def to_be_integrated(*x):
            y=anp.array(x)
            hval=h(y)
            res=anp.sum((hval.reshape(len(y)**2))**2)
            print('h({x1},{x2})={res}'.format(x1=str(y[0]), x2=str(y[1]), res=str(anp.sum(hval))))
            print('h^2={res}'.format(res=str(res)))
            return res
        if len(self.Nseries)==1:
            i=scip.quad(to_be_integrated, float(self.mins[0]),float(self.maxs[0]))
            return i
        elif len(self.Nseries)==2:
            i= scip.dblquad(to_be_integrated, float(self.mins[1]), float(self.maxs[1]),
                            lambda x: float(self.mins[0]), lambda x: float(self.maxs[0]))
        elif len(self.Nseries)==3:
            i= scip.tplquad(to_be_integrated, self.mins[2], self.maxs[2],
                            lambda x: self.mins[1], lambda x: self.maxs[1],
                            lambda x: self.mins[0], lambda x: self.maxs[0])
        else:
            assert False, 'cant integrate this many dimensions.'
        return i




if __name__ == '__main__':
    f = create_spline_function(3.0, 0.0, 1.0, 2.0)
    g = autograd.grad(f)
    for x in range(-4, 4):
        inp = anp.array(float(x))
        gx = g(inp)
        print('f(x)={fx}, g(x)={gx}'.format(fx=str(f(float(x))), gx=str(gx)))
    st = tester([
        [0.0, 1.1, 2.0],
        [3.3, 10.0, 20.3, 103.3]
    ])

    

    print(st.total_spline([0.5, 5.3], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]))
    def h(x):
        return st.total_spline(x, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0])


    hp = autograd.hessian(h)
    print(st.total_spline([0.5, 5.3], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]))
    print(hp(anp.array([0.5,5.3])))

    print(st.integrate_for_penalizer_faster([1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0]))


    def h(x):
        return x ** 3


    hp = autograd.grad(h)
    hpp = autograd.grad(hp)
    print(3.0, h(3.0), hp(3.0), hpp(3.0))
