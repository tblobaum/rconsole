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

using namespace node;
using namespace v8;

char title[1024];
Local<Integer> facility;
Local<Integer> log_upto;

class Syslog {
  public:
  static void Init(Handle<Object> target) {
    HandleScope scope;
    NODE_SET_METHOD(target, "open", open);
    NODE_SET_METHOD(target, "exit", exit);
    NODE_SET_METHOD(target, "log", log);
  }

  static Handle<Value> open(const Arguments& args) {
    HandleScope scope;

    args[0]->ToString()->WriteAscii((char*) &title);
    facility = args[1]->ToInteger();
    log_upto = args[2]->ToInteger();

    setlogmask (LOG_UPTO (log_upto->Int32Value()));
    openlog (title, LOG_PID | LOG_NDELAY, facility->Int32Value());

    return scope.Close(String::New("true"));
  }

  static Handle<Value> exit(const Arguments& args) {
    HandleScope scope;
    closelog();
    return scope.Close(String::New("true"));
  }

  static Handle<Value> log(const Arguments& args) {
    HandleScope scope;

    Local<Integer> severity = args[0]->ToInteger();
    char message[ args[1]->ToString()->Length() ];
    args[1]->ToString()->WriteAscii((char*) &message);

    syslog (severity->Int32Value(), "%s", message);

    return scope.Close(Number::New(args[1]->ToString()->Length() ));
  }

};

extern "C" {
  static void init (Handle<Object> target) {
    Syslog::Init(target);
  }
  NODE_MODULE(syslog, init);
}
