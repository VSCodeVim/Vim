" Basic for loop
let x = 1
for i in [2, 3, 4, 5]
  let x *= i
endfor
call assert_equal(120, x)
