mat=rbind(c(1,0.5,0.5,0.25),
          c(1,1.5,0.5,0.75),
          c(1,0.5,2,1),
          c(1,1.5,2,3))
iv=solve(mat)
H=rbind(c(1,0.5,0.5,0.25),
        c(1,0.5,1.5,0.75),
        c(2,1,4,2)/2,
        c(2,3,4,6)/2)

B=H%*%iv
Bi=solve(B)
R=c(1,2,3,8)
iv%*%R

switcher=rbind(c(1,0,0,0),
               c(0,0,1,0),
               c(0,1,0,0),
               c(0,0,0,1))
switcher%*%mat
mat%*%switcher
switcher%*%mat%*%switcher
solve(switcher)
#så hvis jeg skriver (mat*switcher)^-1=switcher^-1*mat

iv
solve(mat%*%switcher)%*%R
solve(switcher%*%mat%*%switcher)%*%R
