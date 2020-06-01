rd=read.table('rrds.txt', header=T, sep=',')
get_interval=function(val){
  RV=strsplit(val, split='-', fixed=T)[[1]]
  if(length(RV)==1){
    res <- as.numeric(c(RV[1],RV[1]))
  }
  else{
    res <- as.numeric(c(RV[1], RV[2]))
  }
  return(res)
}

z_in_interval=function(intervals, z){
  for(i in 1:length(intervals)){
    interval=intervals[[i]]
    if(z[i]>interval[2]+1e-7 || z[i]<interval[1]-1e-7){
      return(F)
    }
  }
  return(T)
}

construct_f=function(fromtos, formulas){
  r=list()
  for(i in 1:length(formulas)){
    form=formulas[i]
    f=parse_formula(form)
    r[[i]] <- f
  }
  intervals=list()
  for(i in 1:nrow(fromtos)){
    intervals_for_area=list()
    for(j in 1:ncol(fromtos)){
      intervals_for_area[[j]] <- get_interval(fromtos[i,j])
    }
    intervals[[i]] <- intervals_for_area
  }
  print(intervals)
  interpol_function=function(z){
    for(i in 1:length(intervals)){
      if(z_in_interval(intervals[[i]], z)){
        #print(paste(i, intervals[[i]],z))
        return(r[[i]](z))
      }
    }
  }
  return(interpol_function)
}
library(R.utils)
parse_formula=function(form){
  parts=strsplit(form,split='+', fixed = T)[[1]]
  nested_list=strsplit(parts, split='*', fixed=T)
  coefficients=numeric(length(nested_list))
  all_factors=character()
  for( n in 1:length(nested_list)){
    if(length(nested_list[[n]])> 1){
      all_factors=c(all_factors, nested_list[[n]][2:length(nested_list[[n]])])
    }
    coefficients[n]=as.numeric(nested_list[[n]][1])
  }
  all_factors=unique(all_factors)
  reverse=1:length(all_factors)
  names(reverse) <- all_factors
  list_of_indices=list()
  for(n in 1:length(nested_list)){
    if(length(nested_list[[n]])>1){
      factors=nested_list[[n]][2:length(nested_list[[n]])]
      list_of_indices[[n]] <- reverse[factors]
    }
    else{
      list_of_indices[[n]] <-  c()
    }
  }
  res_f=function(x){
    res=0
    for(i in 1:length(nested_list)){
      term=coefficients[i]
      required_factors=list_of_indices[[i]]
      if(length(required_factors)>0){
        term=term*prod(x[required_factors])
      }
      res=res+term
    }
    return(res)
  }
  return(res_f)
}

fromtos=as.matrix(rd[,1:(ncol(rd)-1)])
vals=rd[,ncol(rd)]
f=construct_f(fromtos,as.character(vals))


valmat=matrix(0,nrow=0,ncol=3)
x=seq(0,35.5, length.out = 100)
y=seq(0,50, length.out=100)
z=matrix(0, nrow=100,ncol=100)
for(i in 1:100){
  for(j in 1:100){
    z[i,j]=f(c(x[i],y[j]))
  }
}
xv=runif(10000)*35.5
yv=runif(10000)*50
zv=numeric(10000)
for(i in 1:10000){
  zv[i]=f(c(xv[i],yv[i]))
}
library(dplyr)
persp(x,y,z)


rd2=read.table('C:/Users/Svend/git/DeathCauses/compile/rrd2.txt', header=T, sep=',')
fromtos2=as.matrix(rd2[,1:(ncol(rd2)-1)])
vals2=rd2[,ncol(rd2)]
f2=construct_f(fromtos2,as.character(vals2))
fromtos2
x=runif(1000)*56
y=sapply(X = x, FUN = f2)
plot(x,y)

library(plotly)
fig <- plot_ly(x=x,y=y,z=z)
fig <- fig %>% add_surface()

htmlwidgets::saveWidget(as_widget(fig), "index.html")

from_toRR=rbind()

other_fromtos=read.table('C:/Users/Svend/git/DeathCauses/Database/Causes/Cancer/MouthCancer/rr_Drinking-SmokeIntensity/Drinking-SmokeIntensity.txt')

tester=function(from_tos){
  
  simx=function(){
    x=c()
    for(i in 1:nrow(from_tos)){
      x=c(x, runif(1)*(from_tos[i,2]-from_tos[i,1])+from_tos[i,1])
    }
    return(x)
  }
  xs=replicate(1000,simx())
  zs=apply(xs,2,f)
  return(mean(zs))
}
r=rbind(c(29,42), c(40,60))
tester(r)

l=sapply(seq(0, 50, length.out = 1000), function(x) {f(c(1,x))})
l=sapply(seq(0, 35.5, length.out = 1000), function(x) {f(c(x,40))})
plot(l)
f
