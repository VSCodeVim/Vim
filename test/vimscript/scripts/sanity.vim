call assert_equal(2 + 2, 4)
call assert_notequal(2 + 2, 5)

let x = 5
call assert_equal(10 / 2, x)

call assert_equal('\n', "\\n")

call assert_true(v:true)
call assert_false(v:false)
