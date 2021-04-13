library(tidyverse)


get_number_of_risk_factors=function(riskratiotable){
  return(length(riskratiotable$riskFactorNames))
}

read_limits=function(x){
  if(substr(x,1,1)==','){
    rest=substr(x,2,nchar(x))
    return(c("-Inf", rest,paste('-Inf',rest,sep=','),'numeric'))
  }
  if(substr(x,nchar(x),nchar(x))=='+'){
    res=substr(x,1,nchar(x)-1)
    return(c(res, 'Inf',paste(res, 'Inf',sep='-'), 'numeric'))
  }
  if(grepl(',', x)){
    l=strsplit(x, split = ',', fixed = T)[[1]]
    return(c(l[1],l[2],x,'numeric'))
  }
  if(    !is.na(as.numeric(x))    ){
    return(c(x,x,paste(x,x,sep='-'),'numeric'))
  }
  else{
    return(c(x,x,x,'other'))
  }
}

analyze_limits=function(lim_mat){
  #we know that the smalles limit is the first entry and so on.
  types=c()
  plotting_limits=c()
  interpolation_plotting_limits=c()
  tick_strings=c()
  tick_positions=c()
  starter=1
  if(!is.finite(mean(lim_mat[1,]))){
    types=c(types, '-x')
    size_of_second_interval=diff(lim_mat[2,])
    lower_limit=lim_mat[1,2]-size_of_second_interval
    plotting_limits=c(plotting_limits,lower_limit, lim_mat[1,2])
    interpolation_plotting_limits=c(interpolation_plotting_limits,lower_limit, lim_mat[1,2])
    tick_positions=c(tick_positions,lower_limit, lim_mat[1,2])
    tick_strings=c(tick_strings,'-Inf', as.character(lim_mat[1,2]))
    starter=2
  }
  n=nrow(lim_mat)
  #print(paste('n',n))
  if(starter< n){
    for(i in starter:n){
      if(i==n  && !is.finite(mean(lim_mat[i,]))){
        size_of_second_last_interval=diff(lim_mat[n-1,])
        plotting_limits=c(plotting_limits, plotting_limits[length(plotting_limits)]+size_of_second_last_interval)
        interpolation_plotting_limits=c(plotting_limits, plotting_limits[length(plotting_limits)])
        tick_positions=c(tick_positions, plotting_limits[length(plotting_limits)])
        tick_strings=c(tick_strings, 'Inf')
        types=c(types,'y+')
        break
      }
      if(diff(lim_mat[i,])==0){
        #time to make room!
        sizes=c()
        if(i>1){
          #print(paste('adding', diff(lim_mat[i-1,]), 'to the sizes'))
          sizes=c(sizes, diff(lim_mat[i-1,]))
        }
        if(i<n){
          #print(paste('adding', diff(lim_mat[i+1,]), 'to the sizes'))
          sizes=c(sizes, diff(lim_mat[i+1,]))
        }
        at_size=min(sizes)/5
        #print(at_size)
        if(i==1){
          plotting_limits=c(lim_mat[i,1]-at_size, lim_mat[i,2]+at_size)
          tick_positions=c(lim_mat[i,1])
          interpolation_plotting_limits=rep(lim_mat[i,1],2)
          tick_strings=c(as.character(lim_mat[i,1]))
        }
        else{
          #we have to change the previous choice of limit
          plotting_limits[length(plotting_limits)]=lim_mat[i,1]-at_size
          plotting_limits=c(plotting_limits, lim_mat[i,1]+at_size)
          #no need to change anything else
        }
        types=c(types, 'x')
      }
      else{
        if(i==1){
          plotting_limits=lim_mat[i,]
          tick_positions=lim_mat[i,]
          interpolation_plotting_limits=lim_mat[i,]
          tick_strings=as.character(lim_mat[i,])
        }
        else{
          plotting_limits=c(plotting_limits, lim_mat[i,2])
          interpolation_plotting_limits=c(interpolation_plotting_limits,lim_mat[i,2])
          tick_positions=c(tick_positions,lim_mat[i,2])
          tick_strings=c(tick_strings, as.character(lim_mat[i,2]))
        }
        types=c(types, 'x-y')
      }
    }
  }
  return(list(types=types, plotting_limits=plotting_limits,
              tick_positions=tick_positions,
              tick_strings=tick_strings,
              interpolation_plotting_limits=interpolation_plotting_limits))
}

make_factor_object= function(fourcolumned_matrix){
  object=list()
  numeric_possible=T
  if(ncol(fourcolumned_matrix)==5){
    if(sum(fourcolumned_matrix[,5]=='FALSE')){
      numeric_possible=F
    }
  }
  if(sum(fourcolumned_matrix[,4]=='other')==0 && numeric_possible){ #all levels are numeric
    object$type='numeric'
    uniq_vals=unique(fourcolumned_matrix)  #takes unique rows for some reason
    num_uniq_vals=apply(uniq_vals[,1:2], c(1,2), as.numeric)
    avg_vals=apply(num_uniq_vals, 1, mean)
    uniq_vals=uniq_vals[order(avg_vals),]
    remapper=1:nrow(uniq_vals)
    names(remapper)=uniq_vals[,3]
    object$values=fourcolumned_matrix[,3]
    object$remapper=remapper
    object$actual_limits=uniq_vals[,1:2]
    lims=analyze_limits(num_uniq_vals)
    object$plotting_limits=lims$plotting_limits
    object$tick_strings=lims$tick_strings
    object$tick_positions=lims$tick_positions
    object$interval_types=lims$types
    object$interpolation_plotting_limits=lims$interpolation_plotting_limits
  }
  else{
    object$type='categorical'
    object$values=fourcolumned_matrix[,3]
    uniq_vals=unique(fourcolumned_matrix)
    remapper=1:nrow(uniq_vals)
    names(remapper)=uniq_vals[,3]
    object$remapper=remapper
    object$tick_strings=uniq_vals[,3]
    object$tick_positions=1:length(uniq_vals[,3])
    object$plotting_limits=seq(0.5,length(uniq_vals[,3])+0.5,1)
  }
  return(object)
}

create_data_frame_from_interpolation_table=function(interpolationtable, riskratio_names){
  table_content=matrix(0, nrow=0, ncol=length(riskratio_names)*5+3)
  nfacts=length(riskratio_names)
  for(i in 1:length(interpolationtable$cells)){
    row=interpolationtable$cells[[i]]
    factor_values=c()
    if("interpolation_domains" %in% names(row)){
      int_domains=row$interpolation_domains
    }
    else{
      int_domains=c()
    }
    if("non_interpolation_domains" %in% names(row)){
      non_int_domains=row$non_interpolation_domains
    }
    else{
      non_int_domains=c()
    }
    factor_values=c(int_domains, non_int_domains)
    included_in_interpolation=c(rep(1,length(int_domains)), rep(0,length(non_int_domains)))
    factor_limits=sapply(factor_values, read_limits)
    to_add_vector=c()
    for(j in 1:nfacts){
      to_add_vector=c(to_add_vector, 
                      factor_limits[,j], 
                      as.character(included_in_interpolation[j]))
    }
    if("interpolation_polynomial" %in% names(row)){
      value=row$interpolation_polynomial
    }
    else{
      value=row$value
    }
    to_add_vector=c(to_add_vector,
                    value,
                    "NULL",
                    "NULL")
    table_content=rbind(table_content, to_add_vector)
  }
  factor_objects=list()
  count=1
  for(i in seq(1,length(riskratio_names)*5,5)){
    factor_objects[[riskratio_names[count]]] <- make_factor_object(table_content[,i:(i+4)])
    count=count+1
  }
  rd=data.frame(table_content)
  first_col_names <-  as.vector(sapply(riskratio_names, function(x){ paste(x, c('lower','upper','factorlevel','type','in_interpolation'), sep='.')}))
  colnames(rd) <- c(first_col_names, 'function_equation','min','max')
  rd$min=as.numeric(as.character(rd$min))
  rd$max=as.numeric(as.character(rd$max))
  return(list(df=rd, factors=factor_objects))
}

create_data_frame_from_riskratio_table=function(riskratio_numbers, riskratio_names){
  limits=matrix(0,nrow=0, ncol=length(riskratio_names)*4)
  risks=c()
  for(i in 1:length(riskratio_numbers)){
    factor_values=riskratio_numbers[[i]][[1]]
    factor_limits=as.vector(sapply(factor_values, read_limits))
    limits=rbind(limits, factor_limits)
    risks=c(risks, riskratio_numbers[[i]][[2]])
  }
  factor_objects=list()
  count=1
  for(i in seq(1,length(riskratio_names)*4,4)){
    factor_objects[[riskratio_names[count]]] <- make_factor_object(limits[,i:(i+3)])
    count=count+1
  }
  rd=data.frame(limits)
  colnames(rd) <- as.vector(sapply(riskratio_names, function(x){ paste(x, c('lower','upper','factorlevel','type'), sep='.')}))
  rd$risks=risks
  return(list(df=rd, factors=factor_objects))
}

order_list_of_factors=function(riskratio_dataframe){
  all_cols=colnames(riskratio_dataframe)
  number_of_factors=(length(all_cols)-1)/3
  all_factors_in_string=all_cols[seq(3,number_of_factors*3,3)]
  
}

sort_factors=function(factors){
  categorical_fs=data.frame(fname=character(), nlevs=numeric())
  numeric_fs=data.frame(fname=character(), nlevs=numeric())
  for(fname in names(factors)){
    if(factors[[fname]]$type=='categorical'){
      categorical_fs=rbind(categorical_fs, 
                           data.frame(fname=fname,
                                      nlevs=length(factors[[fname]]$remapper)))
    }
    else if(factors[[fname]]$type=='numeric'){
      numeric_fs=rbind(numeric_fs, 
                       data.frame(fname=fname,
                                  nlevs=length(factors[[fname]]$remapper)))
    }
  }
  numeric_fs %>% arrange(-nlevs) %>% mutate(type='numeric') -> numeric_fs
  categorical_fs %>% arrange(-nlevs) %>% mutate(type='categorical') -> categorical_fs
  res_df <- rbind(numeric_fs, categorical_fs)
  return(res_df)
  
}


make_one_dimensional_plotting_file=function(df, f, fname, output='risks'){
  rownames(df) <- df[,paste(fname,'factorlevel', sep='.')]
  yvals=df[names(f$remapper),output]
  widths=diff(f$plotting_limits)
  xvals=f$plotting_limits[-length(f$plotting_limits)]+widths/2
  res_df=data.frame(y=yvals, x=xvals, widths=widths*0.95)
  return(res_df)
}



plot_one_dimensional_RR=function(df, f, fname){
  p_df <- make_one_dimensional_plotting_file(df,f,fname)
  pl <- ggplot(p_df, aes(x=x,y=y, width=widths))+geom_bar(stat='identity')+
    scale_x_continuous(breaks=f$tick_positions, labels = f$tick_strings)+
    xlab(fname)+ylab('RR')+
    ggtitle('Risk ratios')
  return(pl)
}

make_two_dimensional_plotting_file=function(df, fs, fnames, output='risks'){
  to_join=paste(fnames, "factorlevel",sep='.')
  df %>% mutate(identifier=do.call(interaction, c(sapply(to_join, function(x) sym(x)), list(sep=',')))) -> df2
  rownames(df2) <- df2$identifier
  f1_cats=names(fs[[fnames[1]]]$remapper)
  f2_cats=names(fs[[fnames[2]]]$remapper)
  res_df=expand.grid(f1_cats, f2_cats) 
  colnames(res_df) <- fnames
  res_df %>% mutate(identifier=do.call(interaction, c(sapply(fnames, function(x) sym(x)), list(sep=',')))) -> res_df
  res_df[,output]= df2[as.character(res_df$identifier),output]
  f1_pls=fs[[fnames[1]]]$plotting_limits
  
  f2_pls=fs[[fnames[2]]]$plotting_limits
  
  f1_widths=diff(f1_pls)
  f2_heights=diff(f2_pls)
  f1_xvals=f1_pls[-length(f1_pls)]+f1_widths/2
  f2_yvals=f2_pls[-length(f2_pls)]+f2_heights/2
  res_df2 = cbind(res_df,
                  expand.grid(f1_xvals, f2_yvals),
                  expand.grid(f1_widths, f2_heights))
  n0=ncol(res_df2)
  colnames(res_df2)[(n0-3):n0] <- c("x",'y','width','height')
  return(res_df2)
}


compute_surface_df=function(p_df){
  p_df %>% mutate(zval_00=risks,
                  zval_01=risks,
                  zval_10=risks,
                  zval_11=risks,
                  xval_00=x-width/2+width*0.001,
                  xval_01=x-width/2+width*0.001,
                  xval_10=x+width/2-width*0.001,
                  xval_11=x+width/2-width*0.001,
                  yval_00=y-height/2+height*0.001,
                  yval_01=y+height/2-height*0.001,
                  yval_10=y-height/2+height*0.001,
                  yval_11=y+height/2-height*0.001) %>% 
    pivot_longer(cols=zval_00:yval_11, 
                 names_to=c('.value','first_axis','second_axis'), 
                 names_pattern='(.*)_(.)(.)') -> res_df
  return(res_df)
}

plot_two_dimensional=function(df, factors, fnames){
  p_df=make_two_dimensional_plotting_file(df,factors,fnames)
  xticks=factors[[fnames[1]]]$tick_strings
  xtick_positions=factors[[fnames[1]]]$tick_positions
  yticks=factors[[fnames[2]]]$tick_strings
  ytick_positions=factors[[fnames[2]]]$tick_positions
  res <- ggplot(p_df, aes(x=x,y=y, height=height*0.95, width=width*0.95, fill=risks))+
    geom_tile()+theme_bw()+
    scale_x_continuous(breaks = xtick_positions,
                       labels = xticks) + 
    scale_y_continuous(breaks = ytick_positions,
                       labels = yticks) + 
    scale_fill_gradient(low = "yellow", high = "red", na.value = NA)+
    ggtitle('Risk ratio table')+
    xlab(fnames[1])+ylab(fnames[2])+
    geom_text(aes(x=x,y=y, label=round(risks, digits=1)), color='black')
  return(res)
}

parse_formulas=function(function_equations){
  res=list()
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
  res=lapply(function_equations, parse_formula)
  names(res) <- function_equations
  return(res)
}

parse_spline_formulas=function(function_equations){
  res=list()
  parse_formula=function(form){
    parts=strsplit(form,split='+', fixed = T)[[1]]
    nested_list=strsplit(parts, split='*', fixed=T)
    evaluate_function_part=function(element, x){
      if(substr(element,1,1)=='x'){
        index=as.numeric(substr(element,2,nchar(element)-2))
        degree=as.numeric(substr(element,nchar(element), nchar(element)))
        return(x[index+1]^degree)
      }
      else{
        return(as.numeric(element))
      }
    }
    res_f=function(x){
      res=0
      for(i in 1:length(nested_list)){
        mult=1
        for(element in nested_list[[i]]){
          mult=mult*evaluate_function_part(element, x)
        }
        res=res+mult
      }
      return(res)
    }
    return(res_f)
  }
  res=lapply(function_equations, parse_formula)
  names(res) <- function_equations
  return(res)
}

make_one_dimensional_interpolation_plotting_file=function(df, f, fname, output='function_equation'){
  rownames(df) <- df[,paste(fname,'factorlevel', sep='.')]
  function_equations=df[names(f$remapper),output]
  mins=as.numeric(df[names(f$remapper), 'min'])
  maxs=as.numeric(df[names(f$remapper), 'max'])
  funcs=parse_spline_formulas(as.character(function_equations))
  #yvals=funcs[[1]](f$plotting_limits[1])
  #xvals=f$plotting_limits[1]
  N=33
  to_plot=N-length(f$tick_positions)
  xfrom=min(f$tick_positions)+0.01*diff(range(f$tick_positions))
  xto=min(f$tick_positions)+0.99*diff(range(f$tick_positions))
  xvals=c(sort(f$tick_positions), seq(xfrom,xto, length.out = to_plot))
  midpoints=c(rep('Yes',length(f$tick_positions)), rep('No',to_plot))
  data.frame(x=xvals, m=midpoints) %>% arrange(x) -> res_df
  yvals=numeric(nrow(res_df))
  interpolation_areas=rep('Inside', nrow(res_df))
  truncated=rep('No', nrow(res_df))
  func_index=1
  #print(res_df)
  #print(f$plotting_limits)
  #print(length(funcs))
  # print(res_df)
  # print(f$interpolation_plotting_limits)
  # print(as.character(function_equations))
  for(i in 1:nrow(res_df)){
    while(func_index<length(funcs) && res_df$x[i]>f$interpolation_plotting_limits[func_index+1]+1e-6){
      func_index=func_index+1
    }
    #print(func_index)
    yvals[i]=funcs[[func_index]](res_df$x[i])
    if(!is.na(maxs[func_index]) && yvals[i]>maxs[func_index]){
      yvals[i]=maxs[func_index]
      truncated[i]='Yes'
    }
    if(!is.na(mins[func_index]) && yvals[i]<mins[func_index]){
      truncated[i]='Yes'
      yvals[i]=mins[func_index]
    }
    
    if(f$interval_types[func_index]== 'y+'){
      interpolation_areas[i]='After'
    }
    if(f$interval_types[func_index]== '-x'){
      interpolation_areas[i]='Before'
    }
    
  }
  res_df$y=yvals
  res_df$in_interpolation_area=interpolation_areas
  return(res_df)
}

make_two_dimensional_interpolation_plotting_file=function(df, fs, fnames, output='function_equation', gridsize=11){
  
  to_join=paste(fnames, "factorlevel",sep='.')
  df %>% mutate(identifier=do.call(interaction, c(sapply(to_join, function(x) sym(x)), list(sep=',')))) -> df2
  rownames(df2) <- df2$identifier
  f1_cats=names(fs[[fnames[1]]]$remapper)
  f2_cats=names(fs[[fnames[2]]]$remapper)
  res_df=expand.grid(f1_cats, f2_cats) 
  colnames(res_df) <- fnames
  res_df %>% mutate(identifier=do.call(interaction, c(sapply(fnames, function(x) sym(x)), list(sep=',')))) -> res_df
  function_equations= df2[as.character(res_df$identifier),output]
  funcs=parse_spline_formulas(as.character(function_equations))
  list_of_pieces=list()
  for(i in 1:nrow(res_df)){
    cat1=res_df[i,fnames[1]]
    cat2=res_df[i,fnames[2]]
    cat1index=fs[[fnames[1]]]$remapper[cat1]
    cat2index=fs[[fnames[2]]]$remapper[cat2]
    ft1=fs[[fnames[1]]]$plotting_limits[cat1index:(cat1index+1)]
    from1=ft1[1]
    to1=ft1[2]
    ft2=fs[[fnames[2]]]$plotting_limits[cat2index:(cat2index+1)]
    from2=ft2[1]
    to2=ft2[2]
    cat1max=(cat1index==length(fs[[fnames[1]]]$remapper))
    cat2max= (cat2index==length(fs[[fnames[2]]]$remapper))
    f1vals=seq(from1,to1, length.out = gridsize)
    f2vals=seq(from2,to2, length.out=gridsize)
    i_df=expand.grid(f1vals,f2vals)
    colnames(i_df) <- c('x','y')
    i_df$risks=apply(i_df,1,funcs[[i]])
    i_df$gridposition=F
    i_df$gridposition[1]=T #lower left corner
    i_df$width=diff(f1vals)[1]
    i_df$height=diff(f2vals)[1]
    i_df %>% mutate(xmin=x,
                    ymin=y,
                    xmax=x+width,
                    ymax=y+height) -> i_df
    if(cat1max){
      i_df$gridposition[length(f1vals)]=T
      if(cat2max){
        i_df$gridposition[length(i_df$gridposition)]=T
      }
    }
    if(cat2max){
      i_df$gridposition[length(f1vals)*(length(f2vals)-1)+1]=T
    }
    i_df$cat1max=cat1max
    i_df$cat2max=cat2max
    #print(i_df)
    list_of_pieces[[i]] <- i_df
  }
  res_df3=do.call(rbind, list_of_pieces)
  
  return(res_df3)
}


plot_interpolation_table=function(df, interpolatable_factors, factors, subtitle=''){
  if(length(interpolatable_factors)==2){
    gridsize=10
    xticks=factors[[interpolatable_factors[1]]]$tick_strings
    xtick_positions=factors[[interpolatable_factors[1]]]$tick_positions
    yticks=factors[[interpolatable_factors[2]]]$tick_strings
    ytick_positions=factors[[interpolatable_factors[2]]]$tick_positions
    p_df=make_two_dimensional_interpolation_plotting_file(df, factors, interpolatable_factors, output= 'function_equation', gridsize=gridsize)
    ynudging=diff(range(factors[[interpolatable_factors[2]]]$plotting_limits))/30
    xnudging=diff(range(factors[[interpolatable_factors[1]]]$plotting_limits))/50
    p_df %>% filter(gridposition==T, xmin!=max(xmin)) %>% mutate(xend=xmin+(xmax-xmin)*(gridsize-1), yend=ymin) -> xsegments
    p_df %>% filter(gridposition==T, ymin!=max(ymin)) %>% mutate(xend=xmin, yend=ymin+(ymax-ymin)*(gridsize-1)) -> ysegments
    q <- ggplot(p_df, aes(xmin=xmin,ymin=ymin, ymax=ymax, xmax=xmax, fill=risks))+geom_rect()+
      geom_point(data=filter(p_df, gridposition==T), aes(x=xmin, y=ymin))+
      geom_text(data=filter(p_df, gridposition==T), aes(x=xmin, y=ymin, label=round(risks,2)), position = position_nudge(x=xnudging, y = ynudging))+
      geom_segment(data=rbind(xsegments,ysegments), aes(x=xmin, y=ymin, xend=xend, yend=yend), linetype='dashed')+
      scale_fill_gradient(low = "yellow", high = "red", na.value = NA)+
      xlab(interpolatable_factors[1])+ylab(interpolatable_factors[2])+
      ggtitle(paste('Interpolation',subtitle))+theme_bw()+
      scale_x_continuous(breaks = xtick_positions,
                         labels = xticks) + 
      scale_y_continuous(breaks = ytick_positions,
                         labels = yticks)
    return(q)
  }
  else if(length(interpolatable_factors)==1){
    p_df=make_one_dimensional_interpolation_plotting_file(df,factors[[interpolatable_factors]], interpolatable_factors, output='function_equation')
    xticks=as.character(factors[[interpolatable_factors[1]]]$tick_positions)
    xtick_positions=factors[[interpolatable_factors[1]]]$tick_positions
    q <- ggplot(filter(p_df, in_interpolation_area=='Inside'), aes(x=x, y=y))+
      geom_line()+
      geom_line(data=filter(p_df, in_interpolation_area=='Before'), aes(x=x, y=y), 
                linetype='dashed')+
      geom_line(data=filter(p_df, in_interpolation_area=='After'), aes(x=x, y=y), 
                linetype='dashed')+
      geom_point(data=filter(p_df, m=='Yes'))+
      geom_text(data=filter(p_df, m=='Yes'), aes(x=x,y=y*1.05, label=round(y, digits=3)), color='black')+
      ggtitle(subtitle)+
      xlab(interpolatable_factors)+ylab('Interpolated RR')+
      scale_x_continuous(breaks = xtick_positions,
                         labels = xticks)
    return(q)
  }
}

plot_interpolation_file=function(interpolationtable, riskratio_names){
  res=create_data_frame_from_interpolation_table(interpolationtable, riskratio_names)
  factors=res$factors
  df=res$df
  #print('res=')
  #print(res)
  sfacts=sort_factors(factors)
  #print(sfacts)
  interpolation_dimension=nrow(filter(sfacts, type=='numeric'))
  if(interpolation_dimension==0){
    stop('tried plotting an interpolation file without numeric variables.')
  }
  non_interpolatable_factors=as.character(sfacts$fname[sfacts$type!='numeric'])
  interpolatable_factors=setdiff(riskratio_names, non_interpolatable_factors)
  reslist=list()
  if(length(non_interpolatable_factors)>0 && length(interpolatable_factors)<3){
    non_interpolatables_string=paste(non_interpolatable_factors, 'factorlevel', sep='.')
    collapsed_non_interpol_f=paste(strsplit(non_interpolatable_factors, '.', fixed = T), collapse=',')
    df %>% mutate(non_interpolatable_id=do.call(interaction, c(sapply(non_interpolatables_string, sym),list(sep=',') ))) -> df2
    count=1
    for(f in levels(df2$non_interpolatable_id)){
      df3 <- df2 %>% filter(non_interpolatable_id==f)
      subtitle=paste(collapsed_non_interpol_f, f, sep='=')
      reslist[[count]] <- plot_interpolation_table(df3, interpolatable_factors, factors, subtitle=subtitle)
      count=count+1
    }
  }
  else if(length(interpolatable_factors)<3){
    reslist[[1]] <- plot_interpolation_table(df, interpolatable_factors, factors)
  }
  return(reslist)  
}

plot_risk_ratio_file=function(riskratio_numbers, riskratio_names){
  res=create_data_frame_from_riskratio_table(riskratio_numbers, riskratio_names)
  factors=res$factors
  df=res$df
  #print('res=')
  #print(res)
  sfacts=sort_factors(factors)
  #res=list()
  if(nrow(sfacts)==1){
    #print('entered sfacts=1')
    fname=as.character(sfacts[1,1])
    f=factors[[fname]]
    pl <- plot_one_dimensional_RR(df,f,fname)
    # p_df=make_one_dimensional_plotting_file
    # pl <- ggplot(p_df, aes(x=x,y=y, width=widths))+geom_col()+
    #   scale_x_continuous(breaks=f$tick_positions, labels = f$tick_strings)+
    #   xlab(fname)+ylab('RR')
  }
  if(nrow(sfacts)==2){
    #print('entered sfacts=2')
    fnames=as.character(sfacts[1:2,1])
    pl <- plot_two_dimensional(df, factors, fnames)
  }
  if(nrow(sfacts)>2){
    #print('entered sfacts>2')
  }
  return(pl)
}





library(rjson)
library(plotly)
library(grid)
library(gridExtra)
standard_ages=c(0,1,seq(5,105,5))
standard_ages_string=as.character(standard_ages)
standard_ages_string[length(standard_ages_string)]='Inf'
barwidths=diff(standard_ages)
dat=fromJSON(file = '../../compile/Causes.json')

get_info = function(ca) {
  subdat = dat[[ca]]
  y = subdat$Age$age_prevalences
  x = subdat$Age$age_classification
  flattened_risk_table = list()
  
  #age_plot
  count = 0
  riskratio_names = list()
  riskratio_numbers = list()
  interpolation_tables = list()
  for (riskfactor_group in subdat$RiskFactorGroups) {
    for (l in riskfactor_group$riskRatioTables) {
      count = count + 1
      riskratio_names[[count]] <- l$riskFactorNames
      riskratio_numbers[[count]] <- l$riskRatioTable
      interpolation_tables[[count]] <- l$interpolationTable
    }
  }
  outp = list()
  outp$riskratio_names = riskratio_names
  outp$y = y
  outp$x= x
  outp$riskratio_numbers = riskratio_numbers
  outp$count = count
  outp$interpolationTable = interpolation_tables
  return(outp)
}

make_list_of_plots_for_risk_and_interpolation_factor=function(deathcause, riskfactors){
  list_of_plots = list()
  outp = get_info(deathcause)
  count = outp$count
  if (count > 0) {
    for (i in 1:count) {
      #print(riskfactors)
      #print(outp$riskratio_names[[i]])
      if (riskfactors == paste(outp$riskratio_names[[i]], collapse = '_')) {
        r <-
          plot_risk_ratio_file(
            riskratio_names = outp$riskratio_names[[i]],
            riskratio_numbers = outp$riskratio_numbers[[i]]
          )
        list_of_plots = c(list_of_plots, list(r))
        int_table = outp$interpolationTable[[i]]
        if (length(int_table) > 0) {
          interpolation_plots = plot_interpolation_file(int_table,
                                                        outp$riskratio_names[[i]])
          if(length(interpolation_plots)>0){
            list_of_plots=c(list_of_plots, interpolation_plots)
          }
        }
      }
      
    }
    return(list_of_plots)
  }
  return("The requested plot does not exist")
}

make_plot_for_risk_factor_and_interpolation = function(deathcause, riskfactors) {
  list_of_plots=make_list_of_plots_for_risk_and_interpolation_factor(deathcause, riskfactors)
  list_of_plots$ncol = 1
  g <- do.call(grid.arrange, list_of_plots)
  print(g)
}

make_plot_for_risk_factor = function(deathcause, riskfactors) {
  list_of_plots=make_list_of_plots_for_risk_and_interpolation_factor(deathcause, riskfactors)
  list_of_plots$ncol = 1
  do.call(grid.arrange, list(list_of_plots[[1]]))
}

make_plot_for_interpolation = function(deathcause, riskfactors) {
  list_of_plots=make_list_of_plots_for_risk_and_interpolation_factor(deathcause, riskfactors)
  list_of_plots$ncol = 1
  if(length(list_of_plots)>1){
    do.call(grid.arrange, list_of_plots[-1])
  }
}

#make_plot_for_interpolation('Alzheimers','Caffeine')

make_plot_for_deathcause=function(deathcause, ylabText=NULL){
  outp = get_info(deathcause)
  if(is.null(ylabText)){
    return(make_age_plot(outp$y,outp$x))
  }
  else{
    return(make_age_plot(outp$y, outp$x, ylabText))
  }
  
}


make_age_plot=function(y,x=c(), ylabText="Probability of dying from cause"){
  if(length(x)==0){
    ages=standard_ages
    ages_string=standard_ages_string
  }
  else{
    ages= x
    ages_string=as.character(x)
    
  }
  barwidths=diff(ages)
  age_plot = ggplot(data=data.frame(y=y, 
                                    x=ages[-length(ages)]+barwidths/2,
                                    w=barwidths),
                    aes(x=x,y=y,width=w*0.95))+
    geom_col()+scale_x_continuous(breaks=ages,
                                  labels=ages)+
    xlab('Age')+
    ylab(ylabText)+
    scale_fill_gradient(low = "yellow", high = "darkgreen", na.value = NA)
  return(age_plot)
}