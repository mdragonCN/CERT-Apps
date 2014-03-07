package certapps

import (
	"html/template"
	"net/http"
	"time"

	"appengine"
	"appengine/datastore"
	"appengine/user"
)

type Greeting struct {
	Author  string
	Content string
	Date    time.Time
}

type TContext struct {
	Greetings    []Greeting
	LogInOutLink string
	LogInOutText string
}

type Location struct {
	Line1 string
	Line2 string
	City  string
	State string
	Zip   string

	Created    time.Time
	CreatedBy  *datastore.Key
	Modified   time.Time
	ModifiedBy *datastore.Key
}

type Member struct {
	FirstName string
	LastName  string
	Cell      string
	HomePhone string

	Email  string
	Email2 string

	ShowCell  bool
	ShowEmail bool

	HomeAddress *datastore.Key
	UserID      string

	Created    time.Time
	CreatedBy  *datastore.Key
	Modified   time.Time
	ModifiedBy *datastore.Key
}

func init() {
	http.HandleFunc("/guest", guest)
	http.HandleFunc("/sign", sign)
	http.HandleFunc("/", root)
}

// guestbookKey returns the key used for all guestbook entries.
func guestbookKey(c appengine.Context) *datastore.Key {
	// The string "default_guestbook" here could be varied to have multiple guestbooks.
	return datastore.NewKey(c, "Guestbook", "default_guestbook", 0, nil)
}

func root(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/html/app.htm", http.StatusFound)
}

func guest(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)
	u := user.Current(c)

	// Ancestor queries, as shown here, are strongly consistent with the High
	// Replication Datastore. Queries that span entity groups are eventually
	// consistent. If we omitted the .Ancestor from this query there would be
	// a slight chance that Greeting that had just been written would not
	// show up in a query.
	q := datastore.NewQuery("Greeting").Ancestor(guestbookKey(c)).Order("-Date").Limit(10)
	greetings := make([]Greeting, 0, 10)
	context := TContext{
		Greetings:    greetings,
		LogInOutLink: "boo",
		LogInOutText: "foo",
	}

	if u == nil {
		url, err := user.LoginURL(c, r.URL.String())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		context.LogInOutLink = url
		context.LogInOutText = "Log In"

		c.Infof("not logged in: %v", url)
	} else {
		url, err := user.LogoutURL(c, r.URL.String())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		c.Infof("logged in: %v", url)

		context.LogInOutLink = url
		context.LogInOutText = "Log Out"

		memberQ := datastore.NewQuery("Member").Filter("UserID =", u.ID)
		var member []Member

		c.Infof("Got membersQ and members, calling GetAll")
		_, err = memberQ.GetAll(c, &member)

		c.Infof("after GetAll")

		var mem Member

		if noErr(err, w, c) {
			c.Infof("checking len(members)")
			if len(member) == 0 {
				c.Infof("existing Member not found for user.ID: %v, count:%d", u.ID, len(member))

				l := &Location{
					Line1: "123 Main St",
					City:  "Anytown",
					State: "NJ",
					Zip:   "55555",

					Created:  time.Now(),
					Modified: time.Now(),
					// need to be nil because we don't have the member key to use yet
					CreatedBy:  nil,
					ModifiedBy: nil,
				}

				m := &Member{
					FirstName: "Matt",
					LastName:  "Dragon",
					Email:     "foo@example.com",
					Cell:      "555-555-5555",

					UserID: u.ID,

					Created:  time.Now(),
					Modified: time.Now(),
					// need to be nil because we don't have the member key to use yet
					CreatedBy:  nil,
					ModifiedBy: nil,
				}

				lKey := datastore.NewKey(c, "Location", "", 0, nil)
				mKey := datastore.NewKey(c, "Member", "", 0, nil)

				c.Infof("Putting Member: %v", mKey)
				outMKey, mErr := datastore.Put(c, mKey, m)

				if noErrMsg(mErr, w, c, "Trying to put Member") {
					l.CreatedBy = outMKey
					l.ModifiedBy = outMKey

					c.Infof("Putting Location: %v", lKey)
					outLKey, lErr := datastore.Put(c, lKey, l)

					if noErrMsg(lErr, w, c, "Trying to put Location") {
						c.Infof("no error on 1st member put")

						m.HomeAddress = outLKey
						m.CreatedBy = outMKey
						m.ModifiedBy = outMKey

						_, mErr2 := datastore.Put(c, outMKey, m)
						if noErrMsg(mErr2, w, c, "Trying to put Member again") {
							c.Infof("no error on 2nd member put")
						}
					}
				}

				c.Infof("Member: %v", m)
			} else {
				mem = member[0]
				c.Infof("existing Member found: %d", len(member))
				c.Infof("existing: %+v", mem)
				c.Infof("existing.CreatedBy: %+v", mem.CreatedBy)
				c.Infof("existing.HomeAddress: %+v", mem.HomeAddress)
				c.Infof("user: %+v", *u)
			}
		} else {

		}
	}

	if _, err := q.GetAll(c, &context.Greetings); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := guestbookTemplate.Execute(w, context); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func checkErr(err error, w http.ResponseWriter, c appengine.Context, msg string) bool {
	retval := false
	if err != nil {
		c.Errorf("While attempting: %v Error: %+v", msg, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		retval = true
	} else {
		c.Debugf("no error")
	}
	return retval
}

func noErr(err error, w http.ResponseWriter, c appengine.Context) bool {
	retval := checkErr(err, w, c, "")

	return !retval
}

func noErrMsg(err error, w http.ResponseWriter, c appengine.Context, msg string) bool {
	retval := checkErr(err, w, c, msg)

	return !retval
}

var guestbookTemplate = template.Must(template.New("book").Parse(guestbookTemplateHTML))

const guestbookTemplateHTML = `
<html>
  <body>
  	<a href="{{.LogInOutLink}}">{{.LogInOutText}}</a>
  	  {{range .Greetings}}
      {{with .Author}}
        <p><b>{{.}}</b> wrote:</p>
      {{else}}
        <p>An anonymous person wrote:</p>
      {{end}}
      <pre>{{.Content}}</pre>
    {{end}}
    <form action="/sign" method="post">
      <div><textarea name="content" rows="3" cols="60"></textarea></div>
      <div><input type="submit" value="Sign Guestbook"></div>
    </form>
  </body>
</html>
`

func sign(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)
	g := Greeting{
		Content: r.FormValue("content"),
		Date:    time.Now(),
	}
	if u := user.Current(c); u != nil {
		g.Author = u.String()
	}
	// We set the same parent key on every Greeting entity to ensure each Greeting
	// is in the same entity group. Queries across the single entity group
	// will be consistent. However, the write rate to a single entity group
	// should be limited to ~1/second.
	key := datastore.NewIncompleteKey(c, "Greeting", guestbookKey(c))
	_, err := datastore.Put(c, key, &g)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	http.Redirect(w, r, "/", http.StatusFound)
}
