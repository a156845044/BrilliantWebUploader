<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="upload.aspx.cs" Inherits="FileUploadDemo.upload" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title></title>
    <link href="webuploader/css/webuploader.css" rel="stylesheet" />
</head>
<body>
    <form id="form1" runat="server">
        <div id="wrapper">
            <div id="container">
                <!--头部，相册选择和格式选择-->
                <div id="uploader">
                    <div class="queueList">
                        <div id="dndArea" class="placeholder">
                            <div id="filePicker"></div>
                            <p>或将文件拖到这里，单次最多可选300个</p>
                        </div>
                    </div>
                    <div class="statusBar" style="display: none;">
                        <div class="progress">
                            <span class="text">0%</span>
                            <span class="percentage"></span>
                        </div>
                        <div class="info"></div>
                        <div class="btns">
                            <div id="filePicker2"></div>
                            <div class="uploadBtn">开始上传</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script src="scripts/jquery.js"></script>
        <script src="webuploader/webuploader.min.js"></script>
        <!--[if IE]>
    <script type="text/javascript">
        if (!window.console || !console.firebug) {
            var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml", "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];

            window.console = {};
            for (var i = 0; i < names.length; ++i)
                window.console[names[i]] = function () { }
        }
    </script>
    <script src="https://cdn.bootcss.com/json2/20160511/json2.min.js"></script>
    <![endif]-->
        <script type="text/javascript">
            window.Global = window.Global || {};
            Global.FileQueueds = [];
            Global.GetFileQueued = function (id) {
                var res = [];
                $.each(Global.FileQueueds, function (idx, row) {
                    if (row.id == id) {
                        res = row;
                    }
                })
                return res;
            };
        </script>
        <script type="text/javascript">
            $(function () {
                var _chunk = 0;
                WebUploader.Uploader.register({
                    "before-send-file": "beforeSendFile",
                    "before-send": "beforeSend",
                    "after-send-file": "afterSendFile"
                }, {
                    beforeSendFile: function (file) {
                        console.info('beforeSendFile', Global.FileQueueds, file);
                        $.each(Global.FileQueueds, function (idx, row) {
                            if (row.id == file.id) {
                                _chunk = row.chunk;
                            }
                        });
                        //_chunk = Global.FileQueueds.find(f=>f.id == file.id).chunk;
                    },
                    beforeSend: function (block) {
                        var blob = block.blob.getSource(),
                            deferred = $.Deferred();
                        console.info('blob', block);

                        //根据md5与服务端匹配，如果重复，则跳过。

                        if (block.chunk < _chunk) {
                            deferred.reject();
                        }
                        else {
                            deferred.resolve();
                        }

                        return deferred.promise();

                    },
                    afterSendFile: function (file) {
                    }
                });
            });
        </script>
        <script src="webuploader/upload.js"></script>
        <script type="text/javascript">
            //这是上传文件成功后(文件已合并)的回调事件
            function UploadSuccessCallback(file, md5) {
                console.info('UploadSuccessCallback', file);
                var data = {
                    Name: file.name,
                    Size: file.size,
                    Extension: file.ext
                };
                var jsonData = JSON.stringify(data);
                console.info('提交文件', jsonData);
                $.ajax({
                    url: 'UploadHandler.ashx?action=adduploadrecord',
                    type: 'post',
                    data: { data: jsonData, md5: md5 },
                    dataType: 'json',
                    success: function (data) {
                        console.info(data);
                        if (data.code < 0) {
                            alert(data.errmsg);
                        }
                        else {
                            alert('文件[' + file.name + ']已上传并提交，请耐心等待管理员的审核');
                            $('.pop-window0 .pop-close').click();
                        }
                    }
                });
            };
        </script>

    
    </form>
</body>
</html>
