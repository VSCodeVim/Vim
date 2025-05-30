" Lists have reference semantics
let x = [1, 2, 3]
let y = x
call assert_true(y is x)
call add(x, 4)
call assert_equal([1, 2, 3, 4], y)

" TODO: Test copy()
" TODO: Test deepcopy()
