library(purrr)
simulateTable=function(N=NULL,Ncats=NULL){
  if(is.null(N)){
    N=rpois(1,1)+1
  }
  if(is.null(Ncats)){
    Ncats=rpois(N,1)+2
  }
  cats=sapply(Ncats, function(x){1:x}, simplify = F)
  df=do.call(expand.grid, cats)
  df$RR=pmin(rchisq(nrow(df),df = 1),9.5)
  return(df)
}

numToBits=function(y){
  m <- sapply(decimals,function(x){ as.integer(intToBits(x))})
}

choose_index=function(simtab){
  return(1)
}

combine_tables=function(list_of_tables){
  combine_two_tables=function(tab1,tab2){
    resmat=matrix(0,nrow=0,ncol=ncol(tab1)+ncol(tab2)-1)
    for(i in 1:nrow(tab1)){
      for(j in 1:nrow(tab2)){
        newvars=c(t(tab1[i, 1:(ncol(tab1)-1)]),t(tab2[j, 1:(ncol(tab2)-1)])) # for some strange reason, it makes a list of lists without the t() function
        newval=tab1[i,ncol(tab1)]*tab2[j,ncol(tab2)]
        resmat=rbind(resmat, c(newvars, newval))
      }
    }
    colnames(resmat) <- c(paste0('Var',1:(ncol(resmat)-1)),"RR")
    res=data.frame(resmat)
    res$RR <- as.numeric(as.character(res$RR))
    return(res)
  }
  return(reduce(list_of_tables, combine_two_tables))
}


compute_U=function(simtab,chosen_index=1, subtract=T){
  M=nrow(simtab)
  rs=simtab$RR
  Ncats=ncol(simtab)-1
  us=numeric(2^Ncats)
  gmin=min(rs)
  us[1]=gmin-subtract*gmin
  us[length(us)]=rs[chosen_index]-gmin*subtract
  codes=list(rep(0,Ncats))
  if(Ncats>1){
    for(i in 1:(2^(Ncats)-2)){
      code_as_vector=as.integer(intToBits(i)[1:Ncats])
      tester=rep(1,M)
      for(j in 1:Ncats){
        if(code_as_vector[j]==1){
          tester=tester*(simtab[,j]==simtab[chosen_index,j])
        }
      }
      us[i+1]=min(simtab[tester==1,Ncats+1])-gmin*subtract
      codes[[i+1]]=code_as_vector
    }
  }
  codes[[length(us)]] <- rep(1,Ncats)
  return(list(us=us, codes=codes))
}



compute_Ss=function(us, codes){
  Ss=rep(0, length(us))
  sums=sapply(codes, sum)
  looping_order=order(sums)
  for(i in 1:length(us)){
    i_=looping_order[i]
    code=codes[[i_]]
    Ss[i_]=us[i_]
    if(i>1){
      for(j in 1:length(us)){
        j_=looping_order[j]
        candidate_code=codes[[j_]]
        if(sum(code-candidate_code< -0.5)==0 && j_!=i_){
          Ss[i_]=Ss[i_]-Ss[j_]
        }
      }
    }
    
  }
  return(Ss)
}

compute_marginals=function(Ss, codes){
  Ncats=length(codes[[1]])
  margs=rep(0,Ncats)
  for(i in 1:length(codes)){
    code=codes[[i]]
    cats_in_code=sum(code)
    if(cats_in_code==0){
      next
    }
    contrib=Ss[i]/cats_in_code
    for(j in 1:Ncats){
      if(code[j]==1){
        margs[j]=margs[j]+contrib
      }
    }
  }
  return(margs)
}

a_coefficient=function(Ksize, i_in_K, N){
  if(i_in_K){
    s=0:(N-Ksize)
    return(sum((-1)^s * 1/(Ksize+s) * choose(N-Ksize, s)))
  }
  else{
    s=1:(N-Ksize)
    return(sum((-1)^s * 1/(Ksize+s) * choose(N-Ksize-1, s-1)))
  }
}

compute_marginals_alternative=function(Us, codes){
  one_code=codes[[1]]
  Ncats=length(one_code)
  margs=rep(0,Ncats)
  for(i in 1:length(codes)){
    code=codes[[i]]
    Jsize=sum(code)
    if(Jsize>0){
      for(j in 1:Ncats){
        i_in_K=(code[j]==1)
        margs[j]=margs[j]+Us[i]*a_coefficient(Jsize,i_in_K,Ncats)
      }
    }
  }
  return(margs)
}

compute_alphas_and_betas=function(us,codes){
  code_one=codes[[1]]
  Ncats=length(code_one)
  betas=rep(0,Ncats+1) 
  alpha_is=matrix(0,nrow=Ncats+1, ncol=Ncats)
  alpha_i_stars=matrix(0,nrow=Ncats+1, ncol=Ncats)
  for(i in 1:length(us)){
    code=codes[[i]]
    sumc=sum(code)
    betas[sumc+1]=betas[sumc+1]+us[i]
    for(j in 1:Ncats){
      if(code[j]==1){
        alpha_is[sumc+1,j]=alpha_is[sumc+1,j]+us[i]
      } else{
        alpha_i_stars[sumc+1,j]=alpha_i_stars[sumc+1,j]+us[i]
      }
    }
  }
  return(list(betas=betas, alpha_is=alpha_is, alpha_i_stars=alpha_i_stars))
}

combine_betas=function(b1s, b2s){
  print('combining')
  print(b1s)
  print(b2s)
  res_bs=rep(0,length(b1s)+length(b2s)-1)
  for(i in 1:length(b1s)){
    for(j in 1:length(b2s)){
      res_bs[i+j-1]=res_bs[i+j-1]+b1s[i]*b2s[j]
    }
  }
  return(res_bs)
}

final_sums=function(alpha_is, alpha_i_stars, beta_sums){
  Ncats_alphas=ncol(alpha_is)
  marginals=rep(0, Ncats_alphas)
  total_Ncats=nrow(alpha_is)-1+length(beta_sums)-1
  for(i in 0:total_Ncats){
    for(V_index in 1:Ncats_alphas){
      from_index=max(0,i-(length(beta_sums)-1)) #beta_sums go from 0 to length(beta_sums)-1
      to_index=min(i, Ncats_alphas)
      if(to_index>=from_index){
        for(sum_of_alphas in from_index:to_index){
          sum_of_betas=i-sum_of_alphas
          bsum=beta_sums[sum_of_betas+1]
          if(sum_of_alphas>0){
            addon=a_coefficient(i, T, total_Ncats)*alpha_is[sum_of_alphas+1, V_index] +
              a_coefficient(i,F,total_Ncats)*alpha_i_stars[sum_of_alphas+1, V_index]
          }
          else{ # for K=emptyset
            addon=a_coefficient(i,F,total_Ncats)*alpha_i_stars[sum_of_alphas+1, V_index]
          }
          print(paste(i,V_index, sum_of_alphas, sum_of_betas, bsum, addon))
          marginals[V_index]=marginals[V_index]+addon*bsum
        }
      }
      
    }
  }
  return(marginals)
}

get_stop_ats=function(min_free, max_free){
  difference=max_free-min_free
  if(difference %% 2 == 0){
    #There is an even number between them meaning that there is an uneven number of spots left.
    midpoint=difference/2+min_free
    return(c(midpoint-1,midpoint+1))
  }
  if(difference %% 2 == 1){
    midpoint=difference/2+min_free
    return(c(floor(midpoint),ceiling(midpoint)))
  }
}


compute_marginals_crossproduct=function(many_us, many_codes){
  #computing alphas and betas
  abs=mapply(compute_alphas_and_betas, 
             us=many_us, 
             codes=many_codes,
             SIMPLIFY = F)
  n=length(many_us)
  stop_ats=get_stop_ats(1,n)
  comp_path_first=list(compute_next=1, stop_at=stop_ats[1],direction=1, res=c(1), visited=rep(0,n))
  comp_path_second=list(compute_next=n, stop_at=stop_ats[2],direction=-1, res=c(1), visited=rep(0,n))
  tasks=list(comp_path_first, comp_path_second)
  finished_tasks=list()
  while(length(tasks)>0){
    popped_task=tasks[[length(tasks)]]
    print("all tasks")
    print(tasks)
    print("this task")
    print(popped_task)
    tasks[[length(tasks)]] <- NULL
    new_res=combine_betas(popped_task$res, abs[[popped_task$compute_next]]$betas)
    d=popped_task$direction
    next_compute_candidate=popped_task$compute_next+d
    new_visited=popped_task$visited
    new_visited[popped_task$compute_next]=1
    if(next_compute_candidate*d <= popped_task$stop_at*d){
      tasks[[length(tasks)+1]] <- list(compute_next=next_compute_candidate,
                                       stop_at=popped_task$stop_at,
                                       direction=d,
                                       res=new_res,
                                       visited=new_visited)
    }
    else if(sum(new_visited)==n-1){
      remaining_index=which(new_visited==0)
      finished_tasks[[remaining_index]]=new_res
    }
    else{
      leftovers=which(new_visited==0)
      min_left=min(leftovers)
      max_left=max(leftovers)
      stop_ats=get_stop_ats(min_left, max_left)
      comp_path_one=list(compute_next=min_left, 
                         stop_at=stop_ats[1], 
                         direction=1, 
                         res=new_res,
                         visited=new_visited)
      comp_path_two=list(compute_next=max_left, 
                         stop_at=stop_ats[2],
                         direction=-1,
                         res=new_res,
                         visited=new_visited)
      tasks[[length(tasks)+1]] <- comp_path_one
      tasks[[length(tasks)+1]] <- comp_path_two
    }
  }
  many_alpha_is=lapply(abs, function(x){x$alpha_is})
  many_alpha_i_stars=lapply(abs, function(x){x$alpha_i_stars})
  res=mapply(final_sums, 
             alpha_is=many_alpha_is, 
             alpha_i_stars=many_alpha_i_stars,
             beta_sums=finished_tasks,
             SIMPLIFY = F)
  return(res)
}

simple_test_marginal_crossproduct=function(){
  simtab1=data.frame(Var1=c(1,2), RR=c(2,1))
  simtab2=data.frame(Var1=c(1,2), RR=c(3,1))
  simtabs=list(simtab1,simtab2)
  joint_tab=combine_tables(simtabs)
  str(joint_tab)
  chosen_indices=lapply(simtabs, choose_index)
  outps=lapply(simtabs, compute_U, subtract=F)
  many_us=list()
  many_codes=list()
  for(i in 1:length(outps)){
    many_us[[i]] <- outps[[i]]$us
    many_codes[[i]] <- outps[[i]]$codes
  }
  outp=compute_U(joint_tab)
  codes=outp$codes
  us=outp$us
  margs=compute_marginals_alternative(us,codes)
  print(compute_marginals_crossproduct(many_us,many_codes))
  print(margs)
}

simple_test_marginal_crossproduct()

simple_test_marginal_crossproduct2=function(){
  simtab1=data.frame(Var1=c(1,2,1,2,1,2,1,2),Var2=c(1,1,2,2,1,1,2,2),Var3=c(1,1,1,1,2,2,2,2), RR=rchisq(8,1))
  simtab2=data.frame(Var1=c(1,1,2,2),Var2=c(1,2,1,2), RR=rchisq(4,1))
  simtab3=data.frame(Var1=c(1,2),RR=rchisq(2,1))
  simtabs=list(simtab1,simtab2, simtab3)
  joint_tab=combine_tables(simtabs)
  str(joint_tab)
  chosen_indices=lapply(simtabs, choose_index)
  outps=lapply(simtabs, compute_U, subtract=F)
  many_us=list()
  many_codes=list()
  for(i in 1:length(outps)){
    many_us[[i]] <- outps[[i]]$us
    many_codes[[i]] <- outps[[i]]$codes
  }
  outp=compute_U(joint_tab)
  codes=outp$codes
  us=outp$us
  margs=compute_marginals_alternative(us,codes)
  print(compute_marginals_crossproduct(many_us,many_codes))
  print(margs)
}

simple_test_marginal_crossproduct2()


test_marginal_crossproduct=function(){
  simtabs=replicate(3, simulateTable(), simplify = F)
  joint_tab=combine_tables(simtabs)
  joint_tab=combine_tables(simtabs)
  str(joint_tab)
  chosen_indices=lapply(simtabs, choose_index)
  outps=lapply(simtabs, compute_U, subtract=F)
  many_us=list()
  many_codes=list()
  for(i in 1:length(outps)){
    many_us[[i]] <- outps[[i]]$us
    many_codes[[i]] <- outps[[i]]$codes
  }
  outp=compute_U(joint_tab)
  codes=outp$codes
  us=outp$us
  margs=compute_marginals_alternative(us,codes)
  print(compute_marginals_crossproduct(many_us,many_codes))
  print(margs)
}
test_marginal_crossproduct()

makeSim=function(){
  simtab=simulateTable()
  chosen_index=choose_index(simtab)
  ustar=simtab[chosen_index,ncol(simtab)]-min(simtab[,ncol(simtab)])
  outp=compute_U(simtab)
  us=outp$us
  codes=outp$codes
  codes_as_matrix=do.call(cbind,codes)
  ss=compute_Ss(us,codes)
  margs=compute_marginals(ss, codes)
  return(c(min(margs),ustar, sum(margs)))
}

simtab=simulateTable()
chosen_index=choose_index(simtab)
ustar=simtab[chosen_index,ncol(simtab)]-min(simtab[,ncol(simtab)])
outp=compute_U(simtab)
us=outp$us
codes=outp$codes
codes_as_matrix=do.call(cbind,codes)
ss=compute_Ss(us,codes)
margs=compute_marginals(ss, codes)
margsA=compute_marginals_alternative(us, codes)
cbind(margs, margsA)

reverse_binary_code=function(code){
  return(sum(code*2^(0:(length(code)-1)))+1)
}

find_beneficiaries=function(code){
  number_of_benefs=sum(code)
  res=rep(0,number_of_benefs)
  count=1
  for(i in 1:length(code)){
    if(code[i]==1){
      new_code=code
      new_code[i]=0
      res[count]=reverse_binary_code(new_code)
      count=count+1
    }
  }
  return(res)
}

find_beneficiaries(c(1,1,1,0))

sendDownBlameSystem=function(Ss, codes){
  sums=sapply(codes, sum)
  looping_order=rev(order(sums)) 
  guilts=rep(0,length(Ss))
  ress=rep(0,length(Ss))
  for(i in 1:length(Ss)){
    i_=looping_order[i]
    balance=Ss[i_]+guilts[i_]
    if(balance>0){
      ress[i_]=balance
      guilts[i_]=0
    }
    else if(balance<0){
      inheritors=find_beneficiaries(codes[[i_]])
      if(length(inheritors)>0){
        guilts[i_]=0
      }

      for(inh in inheritors){
        guilts[inh]=guilts[inh]+balance/length(inheritors)
      }
    }
  }
  print(guilts)
  return(ress)
}

#simtab=simulateTable()
chosen_index=choose_index(simtab)
ustar=simtab[chosen_index,ncol(simtab)]-min(simtab[,ncol(simtab)])
outp=compute_U(simtab)
us=outp$us
codes=outp$codes
codes_as_matrix=do.call(cbind,codes)
ss=compute_Ss(us,codes)
margs=compute_marginals(ss, codes)
rbind(ss,sendDownBlameSystem(ss, codes))
ys=sendDownBlameSystem(ss,codes)
sum(ys)
sum(ss)
