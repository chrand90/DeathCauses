library(xlsx)
dr=read.xlsx("PEP_2014_PEPSYASEXN.xls",
             sheetIndex = 1, startRow = 5,dec=",")
dr=dr[c(2:102),]
indexes=c(1,4,rep(5, 95/5),1)
vec=rep(0,length(indexes))
cind=cumsum(indexes)
last_index=0
femalemale=matrix(0, nrow=length(indexes), ncol=2)
num_femalemale=matrix(0, nrow=length(indexes), ncol=2)

for(i in 1:length(indexes)){
  #vec[i]=sum(as.numeric(gsub(",", "", dr$Both.Sexes.6[(last_index+1):cind[i]])))
  female=sum(as.numeric(gsub(",", "", dr$Female.6[(last_index+1):cind[i]])))
  male=sum(as.numeric(gsub(",", "", dr$Male.6[(last_index+1):cind[i]])))
  vec[i]=female+male
  num_femalemale[i,]=c(female,male)
  femalemale[i,]=c(female,male)/vec[i]
  last_index=cind[i]
}
df.fem=data.frame(femalemale)
colnames(df.fem) <- c("Female","Male")
df.fem$Age <- c("0-1","1-5", paste0((1:19)*5,"-",(2:20)*5),"100+")
library(reshape2)
df.fem.ny=melt(df.fem, variable.name = "Gender", measure.vars = c("Female", "Male"))
write.table(df.fem.ny, "C:/Users/Svend/Dropbox/Workspace/Karamel/DeathCauses3/Database/Factor_frequencies/Gender-Age_copy.txt", row.names = F, sep="\t")
write(vec, file =paste0("C:/Users/Svend/Dropbox/Workspace/Karamel/DeathCauses3/Database/","population",".txt"), ncolumns = 100)

num_femalemale
ft=apply(num_femalemale,2,sum)/sum(num_femalemale)
ft[1]*c(0.022,0.014,1-0.036)
ft[2]*c(0.011,0.022,1-0.033)

