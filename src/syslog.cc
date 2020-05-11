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
#include <nan.h>

using namespace std;
using namespace node;
using namespace v8;

char title[1024];

void open(const FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();
  args[0]->ToString(Nan::GetCurrentContext()).FromMaybe(v8::Local<v8::String>())->WriteUtf8(isolate, (char*) &title);
  int32_t facility = args[1]->ToInt32(Nan::GetCurrentContext()).ToLocalChecked()->Value();
  int32_t log_upto = args[2]->ToInt32(Nan::GetCurrentContext()).ToLocalChecked()->Value();
  setlogmask(LOG_UPTO(log_upto));
  openlog(title, LOG_PID | LOG_NDELAY, facility);

  v8::HandleScope scope(isolate);
  args.GetReturnValue().Set(v8::String::NewFromUtf8(isolate, "true", v8::NewStringType::kNormal).ToLocalChecked());
}

void exit(const FunctionCallbackInfo<v8::Value>& args) {
  closelog();

  v8::Isolate* isolate = args.GetIsolate();
  v8::HandleScope scope(isolate);
  args.GetReturnValue().Set(v8::String::NewFromUtf8(isolate, "true", v8::NewStringType::kNormal).ToLocalChecked());
}

void log(const FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();

  int32_t severity = args[0]->ToInt32(Nan::GetCurrentContext()).ToLocalChecked()->Value();
  v8::String::Utf8Value message(isolate, args[1]->ToString(Nan::GetCurrentContext()).FromMaybe(v8::Local<v8::String>()));
  syslog(severity, "%s", *message );

  v8::HandleScope scope(isolate);
  args.GetReturnValue().Set(v8::String::NewFromUtf8(isolate, "true", v8::NewStringType::kNormal).ToLocalChecked());
}

void init(v8::Local<v8::Object> target) {
  NODE_SET_METHOD(target, "open", open);
  NODE_SET_METHOD(target, "exit", exit);
  NODE_SET_METHOD(target, "log", log);
}

NODE_MODULE(syslog, init)
