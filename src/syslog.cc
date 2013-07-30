// (The MIT License)

// Copyright (c) 2012 Thomas Blobaum <tblobaum@gmail.com>

// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// 'Software'), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:

// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
// CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
// TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#include <v8.h>
#include <node.h>
#include <syslog.h>
#include <string>

using namespace std;
using namespace node;
using namespace v8;

char title[1024];

static v8::Handle<v8::Value> open(const v8::Arguments& args) {
  args[0]->ToString()->WriteAscii((char*) &title);
  int facility = args[1]->ToInteger()->Int32Value();
  int log_upto = args[2]->ToInteger()->Int32Value();
  setlogmask(LOG_UPTO(log_upto));
  openlog(title, LOG_PID | LOG_NDELAY, facility);

  return String::New("true");
}

static v8::Handle<v8::Value> exit(const v8::Arguments& args) {
  closelog();

  return String::New("true");
}

static v8::Handle<v8::Value> log(const v8::Arguments& args) {
  int severity = args[0]->ToInteger()->Int32Value();
  v8::String::Utf8Value message(args[1]->ToString());
  syslog(severity, "%s", *message );

  return String::New("true");
}

void init(v8::Handle<v8::Object> target) {
  NODE_SET_METHOD(target, "open", open);
  NODE_SET_METHOD(target, "exit", exit);
  NODE_SET_METHOD(target, "log", log);
}

NODE_MODULE(syslog, init)