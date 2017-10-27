import json
package = open('../package.json').read()
package = json.loads(package)
print(package['contributes']['keybindings'])
keysToBind = ['space', 'left', 'right', 'up', 'down', 'esc']
keybindings = []
for i in range(ord('!'), ord('~') + 1):
    keysToBind.append(chr(i))
    print(chr(i))

vimKeyToVS = {'esc': 'Escape'}
for key in keysToBind:
    vsKey = key
    if key in vimKeyToVS:
        vsKey = vimKeyToVS[key]
    for modifier in ['ctrl', 'shift']:
        modKey = '{0}+{1}'.format(modifier, vsKey)
        vimKey = '<{0}-{1}>'.format(modifier[0], key)
        keybind = {'key': modKey,
                   'command': 'vim.{0}'.format(vimKey),
                   'when': 'vim.use_{0}'.format(vimKey),
                   'vimKey': vimKey}
        keybindings.append(keybind)
    if len(key) > 1:
        key = '<{0}>'.format(key)
        keybind = {'key': vsKey, 'command': 'vim.{0}'.format(
            key), 'when': 'vim.use_{0}'.format(key), 'vimKey': key}
        keybindings.append(keybind)


package['contributes']['keybindings'] = keybindings
open('../package.json', 'w').write(json.dumps(package, indent=4, sort_keys=False))
# keybind[]
# // let vimToVSMap: {[key: string]: string[]} = {
# // };
# // let vimToVSMap: {[key: string]: string} = {
# // esc: 'escape',
# // };
# for (let i='!'.charCodeAt(0); i <= '~'.charCodeAt(0); i + +) {
#   keysToBind.push(String.fromCharCode(i));}
# for (let key of keysToBind) {
#   for (let modifier of['c', 's']) {
#     const modKey = `${modifier} -${key}`;
