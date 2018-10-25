t=read.table("Drinking-MaxDrinking.txt", header=T)
t$freq=t$freq/sum(t$freq)
t
write.table(t,"../../Database/Factor_frequencies/Drinking-MaxDrinking_copy.txt", row.names = F)
