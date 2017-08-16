<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="plugindemo.aspx.cs" Inherits="FileUploadDemo.plugindemo" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title></title>
    <!--项目中首先引入jquery-->
    <script src="webuploader/jquery.js"></script>
</head>
<body>
    <form id="form1" runat="server">
        <!--插件初始化dom,必须指定ID-->
        <div id="plugin"></div>
        <table>
            <tr>
                <th>操作：</th>
                <td>
                    <input type="button" id="btnsave" style="width: 100px; height: 25px;" value="保存" /></td>
            </tr>
            <tr>
                <th>结果：</th>
                <td>
                    <textarea id="txtResult" cols="100" rows="20"></textarea></td>
            </tr>
        </table>
        <!--引入插件-->
        <script src="webuploader/brilliant.webuploader.js"></script>
        <script type="text/javascript">
            //初始化插件
            $(function () {
                var model = $("#plugin").BrilliantWebUploader();

                var webuploader = model.options.uploader;//获取webuploader 对象，此对象可操作原生Web Uploader，具体方法请参照官方文档http://fex.baidu.com/webuploader/

                //获取已上传文件对象列表
                $("#btnsave").click(function () {
                    $("#txtResult").val(JSON.stringify(model.getData()));
                });
            });
        </script>
    </form>
</body>
</html>
