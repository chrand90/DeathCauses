tr=read.table("Age-Depression.txt")
rnames=tr[,1]
tr=apply(tr[,-1],c(1,2), function(x){as.numeric(gsub(",", "", x))})
rownames(tr) <- rnames

help("aggregate")
tr2=matrix(0,nrow=0, ncol=ncol(tr))
tr2=rbind(tr2,apply(tr[1:4,],2,mean))
tr2=rbind(tr2,apply(tr[5:10,],2,mean))
tr2=rbind(tr2,apply(tr[11:15,],2,mean))
tr2=rbind(tr2, tr[16:length(tr[,1]),])

df.res=data.frame(tr2)
rownames(df.res) <- c("-15",paste0((3:12)*5,"-", (4:12)*5))
df.res[,2]/100



