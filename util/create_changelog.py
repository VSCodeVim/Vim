import requests
import bs4
import re

GITHUB_URL = "https://github.com"
f = open("CHANGELOG.md", "w")
r = requests.get('https://github.com/VSCodeVim/Vim/releases')
bs = bs4.BeautifulSoup(r.text, "html5lib")
results = bs.select(
    '#js-repo-pjax-container > div.container.new-discussion-timeline.experiment-repo-nav > div.repository-content > div.release-timeline > div'
)
for i in results:
  title = i.select_one("div.release-body.commit.open > div.release-header > h1 > a").text
  link = i.select_one("div.release-body.commit.open > div.release-header > h1 > a")["href"]
  tag = i.select_one("div.release-meta > ul > li > a > span").text
  date = i.select_one("div.release-body.commit.open > div.release-header > p > relative-time")
  date = date.text
  body = i.select_one("div.release-body.commit.open > div.markdown-body")
  f.write("# [" + tag + " " + title + "](" + GITHUB_URL + link + ")" + "  (" + date + ")\n")
  # objects are all the paragraphs, headers, tags, etc.
  objects = body.select("p,h2,li")

  objects = sorted(objects, key=lambda a: str(body).index(str(a)))
  for i in objects:
    obj_text = i.decode_contents()
    links = i.select('a')
    for link in links:
      obj_text.replace(str(link), link.text)
    if re.match('^<p>', str(i)):
      print('p')
      f.write('\n' + obj_text + '\n')
    elif re.match('<li>', str(i)):
      f.write('* ' + obj_text + '\n')
      print('l')
    elif re.match('<h2>', str(i)):
      f.write('## ' + obj_text + '\n')
  print('---------')
