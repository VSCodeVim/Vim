" Just if, true
let x = 0
if v:true
  let x = 1
endif
call assert_equal(1, x)

" Just if, false
if v:false
  call assert_report('if branch should not have been called')
endif

" If else - if branch
let x = 0
if v:true
  let x += 1
  let x += 1
else
  call assert_report('else branch should not have been called')
endif
call assert_equal(2, x)

" If else - else branch
let x = 0
if v:false
  call assert_report('if branch should not have been called')
else
  let x += 1
  let x += 1
  let x += 1
endif
call assert_equal(3, x)

" TODO: elseif
