" Basic while loop
let x = 2
while x < 1000
  let x *= 2
endwhile
call assert_equal(1024, x)

" Nested while loops
let x = 0
let i = 0
while i < 10
  let j = 0
  while j < 5
    let x += 1
    let j += 1
  endwhile
  let i += 1
endwhile
call assert_equal(50, x)

" Break
let x = 2
while v:true
  let x *= 2
  if x > 1000
    break
    call assert_report('after break')
  endif
endwhile
call assert_equal(1024, x)

" Continue
let x = []
let i = 0
while i < 10
  let i += 1
  if i % 2 == 0
    continue
    call assert_report('after continue')
  endif
  let x += [i]
endwhile
call assert_equal([1, 3, 5, 7, 9], x)
