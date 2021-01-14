simulateTable=function(){
  N=rpois(1,1)+1
  Ncats=rpois(N,1)+2
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


compute_U=function(simtab,chosen_index=1){
  M=nrow(simtab)
  rs=simtab$RR
  Ncats=ncol(simtab)-1
  us=numeric(2^(Ncats-1)+2)
  gmin=min(rs)
  us[1]=0
  us[length(us)]=rs[chosen_index]-gmin
  codes=list(rep(0,Ncats))
  for(i in 1:(2^(Ncats)-1)){
    code_as_vector=as.integer(intToBits(i)[1:Ncats])
    tester=rep(1,M)
    for(j in 1:Ncats){
      if(code_as_vector[j]==1){
        tester=tester*(simtab[,j]==simtab[chosen_index,j])
      }
    }
    us[i+1]=min(simtab[tester==1,Ncats+1])-gmin
    codes[[i+1]]=code_as_vector
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
