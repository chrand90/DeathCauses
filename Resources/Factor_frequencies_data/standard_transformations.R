#calculates intersection between two intervals
intersection=function(a1,a2,b1,b2){
  max(0, min(a2,b2)-max(a1,b1))
}


#
#percentiles should contain 0 and 1 as specific points. 
#values are the quantiles - the value at the percentiles.
#length of values should be the same as length of percentiles
percentile_to_fixed=function(percentiles, values, new_breaks){
  ans=rep(0,length(new_breaks)-1)
  for(i in 2:length(new_breaks)){
    n1=new_breaks[i-1]
    n2=new_breaks[i]
    for(j in 1:(length(values)-1)){
      v1=values[j]
      v2=values[j+1]
      p1=percentiles[j]
      p2=percentiles[j+1]
      ans[i-1]=ans[i-1]+(p2-p1)*intersection(v1,v2,n1,n2)/(v2-v1)
    }
  }
  return(ans)
}

