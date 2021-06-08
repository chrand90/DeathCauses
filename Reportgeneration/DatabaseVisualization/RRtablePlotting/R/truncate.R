truncater=function(z, table, cell){
  truncate=F
  res_val=z
  if(length(table@lower_truncation)>0 && z<table@lower_truncation){
    truncate=T
    res_val=table@lower_truncation
  }
  else if(length(table@upper_truncation)>0 && z>table@upper_truncation){
    truncate=T
    res_val=table@upper_truncation
  }
  else if(length(cell@upper_truncation)>0 && z>cell@upper_truncation){
    truncate=T
    res_val=cell@upper_truncation
  }
  else if(length(cell@lower_truncation)>0 && z<cell@lower_truncation){
    truncate=T
    res_val=cell@lower_truncation
  }
  return(list(truncate=truncate, znew=res_val))
}