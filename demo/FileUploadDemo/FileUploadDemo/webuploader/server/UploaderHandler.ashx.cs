using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using Newtonsoft.Json;

namespace FileUploadDemo
{
    /// <summary>
    /// 上传逻辑
    /// </summary>
    public class UploaderHandler : IHttpHandler
    {

        public void ProcessRequest(HttpContext context)
        {
            context.Response.ContentType = "text/plain";
            //取得处事类型
            string action = context.Request["action"].ToLower();

            switch (action)
            {
                case "upload": //上传文件
                    Upload(context);
                    break;
                case "getmaxchunk": //获取文件最大分片数
                    GetMaxChunk(context);
                    break;
                case "mergefiles": //合并文件
                    MergeFiles(context);
                    break;
            }
        }

        /// <summary>
        /// 文件存放路径，后期替换为配置文件加载方式
        /// </summary>
        const string _visualPath = "/PlatformFile/files/";


        #region 获取指定文件的已上传的文件块
        /// <summary>
        /// 获取指定文件的已上传的文件块
        /// </summary>
        /// <returns></returns>
        public void GetMaxChunk(HttpContext context)
        {
            string host = context.Request["host"];

            string visualFloder = context.Request["folder"];
            string visualPath = _visualPath;
            if (!string.IsNullOrWhiteSpace(visualFloder))
            {
                visualPath = visualFloder;
            }
            string root = context.Server.MapPath(visualPath);

            AttachInfo attach = new AttachInfo();//待返回的数据

            var md5 = Convert.ToString(context.Request["md5"]);
            var ext = Convert.ToString(context.Request["ext"]);
            int chunk = 0;

            var fileName = md5 + "." + ext;
            try
            {
                FileInfo file = new FileInfo(root + fileName);
                if (file.Exists)//文件存在，则直接返回
                {
                    attach.code = 0;//成功
                    attach.errormsg = "";
                    attach.exists = true;
                    attach.chunk = Int32.MaxValue;//如果文件存在，则返回整型的最大值，插件自动识别，实现秒传
                    attach.path = string.Format("{0}{1}", visualPath, fileName);
                    if (!string.IsNullOrWhiteSpace(host))
                    {
                        attach.fullPath = string.Format("{0}/{1}{2}", host.Trim().TrimEnd('/'), visualPath.Trim().TrimStart('/'), fileName);
                    }

                    attach.extension = ext;
                    attach.md5 = md5;
                    attach.size = file.Length;
                }
                else//不存在，则返回分片大小
                {
                    if (Directory.Exists(root + "chunk\\" + md5))
                    {
                        DirectoryInfo dicInfo = new DirectoryInfo(root + "chunk\\" + md5);
                        var files = dicInfo.GetFiles();
                        chunk = files.Count();
                        if (chunk > 1)
                        {
                            chunk = chunk - 1; //当文件上传中时，页面刷新，上传中断，这时最后一个保存的块的大小可能会有异常，所以这里直接删除最后一个块文件
                        }
                    }

                    attach.code = 0;//成功
                    attach.errormsg = "";
                    attach.exists = false;
                    attach.chunk = chunk;//如果文件存在，则返回整型的最大值，插件自动识别，实现秒传
                    attach.path = string.Format("{0}{1}", _visualPath, fileName);
                    attach.extension = ext;
                    attach.md5 = md5;
                    if (!string.IsNullOrWhiteSpace(host))
                    {
                        attach.fullPath = string.Format("{0}/{1}{2}", host.Trim().TrimEnd('/'), visualPath.Trim().TrimStart('/'), fileName);
                    }

                    attach.size = file.Length;
                }
                context.Response.Write(JsonConvert.SerializeObject(attach));
            }
            catch
            {
                attach.code = 1;//失败
                attach.exists = false;
                attach.errormsg = "";
                attach.chunk = 0;//如果文件存在，则返回整型的最大值，插件自动识别，实现秒传
                attach.path = string.Format("{0}{1}", _visualPath, fileName);
                attach.extension = ext;
                attach.md5 = md5;
                attach.size = 0;
                if (!string.IsNullOrWhiteSpace(host))
                {
                    attach.fullPath = string.Format("{0}/{1}{2}", host.Trim().TrimEnd('/'), visualPath.Trim().TrimStart('/'), fileName);
                }
                context.Response.Write(JsonConvert.SerializeObject(attach));
            }
        }
        #endregion

        #region 上传文件
        /// <summary>
        /// 上传文件
        /// </summary>
        /// <param name="fileData"></param>
        /// <returns></returns>
        public void Upload(HttpContext context)
        {

            string visualFloder = context.Request.Form["folder"];
            string visualPath = _visualPath;
            if (!string.IsNullOrWhiteSpace(visualFloder))
            {
                visualPath = visualFloder;
            }
            HttpPostedFile file = context.Request.Files[0];
            string root = context.Server.MapPath(visualPath);

            AttachInfo attach = new AttachInfo();//待返回的数据


            //检查上传的物理路径是否存在，不存在则创建
            if (!Directory.Exists(root))
            {
                Directory.CreateDirectory(root);
            }

            //如果进行了分片
            if (context.Request.Form.AllKeys.Any(m => m == "chunk"))
            {
                //取得chunk和chunks
                int chunk = Convert.ToInt32(context.Request.Form["chunk"]);//当前分片在上传分片中的顺序（从0开始）
                int chunks = Convert.ToInt32(context.Request.Form["chunks"]);//总分片数
                //根据GUID创建用该GUID命名的临时文件夹
                //string folder = Server.MapPath("~/UploadFiles/" + Request["md5"] + "/");
                string folder = root + "chunk\\" + context.Request["md5"] + "\\";
                string path = folder + chunk;

                //建立临时传输文件夹
                if (!Directory.Exists(Path.GetDirectoryName(folder)))
                {
                    Directory.CreateDirectory(folder);
                }

                FileStream addFile = null;
                BinaryWriter AddWriter = null;
                Stream stream = null;
                BinaryReader TempReader = null;

                try
                {
                    addFile = new FileStream(path, FileMode.Create, FileAccess.Write);
                    AddWriter = new BinaryWriter(addFile);
                    //获得上传的分片数据流
                    stream = file.InputStream;
                    TempReader = new BinaryReader(stream);
                    //将上传的分片追加到临时文件末尾
                    AddWriter.Write(TempReader.ReadBytes((int)stream.Length));
                }
                finally
                {
                    if (addFile != null)
                    {
                        addFile.Close();
                        addFile.Dispose();
                    }
                    if (AddWriter != null)
                    {
                        AddWriter.Close();
                        AddWriter.Dispose();
                    }
                    if (stream != null)
                    {
                        stream.Close();
                        stream.Dispose();
                    }
                    if (TempReader != null)
                    {
                        TempReader.Close();
                        TempReader.Dispose();
                    }
                }


                attach.code = 0;//成功
                attach.errormsg = "";
                attach.chunked = true;//进行了分片处理
                attach.extension = Path.GetExtension(file.FileName);//文件扩展名

                context.Response.Write(JsonConvert.SerializeObject(attach));

            }
            else//没有分片直接保存
            {
                string path = root + context.Request["md5"] + Path.GetExtension(context.Request.Files[0].FileName);
                context.Request.Files[0].SaveAs(path);

                attach.code = 0;//成功
                attach.errormsg = "";
                attach.chunked = false;//直接保存，没有进行分片处理
                attach.extension = Path.GetExtension(file.FileName);//文件扩展名
                context.Response.Write(JsonConvert.SerializeObject(attach));
            }
        }
        #endregion

        #region 合并文件
        /// <summary>
        /// 合并文件
        /// </summary>
        /// <returns></returns>
        public void MergeFiles(HttpContext context)
        {
            string visualFloder = context.Request["folder"];
            string visualPath = _visualPath;
            if (!string.IsNullOrWhiteSpace(visualFloder))
            {
                visualPath = visualFloder;
            }
            string root = context.Server.MapPath(visualPath);

            string guid = context.Request["md5"];
            string ext = context.Request["ext"];
            string sourcePath = Path.Combine(root, "chunk\\" + guid + "\\");//源数据文件夹
            string targetPath = Path.Combine(root, string.Format("{0}.{1}", guid, ext));//合并后的文件

            AttachInfo attach = new AttachInfo();//待返回的数据


            DirectoryInfo dicInfo = new DirectoryInfo(sourcePath);
            if (Directory.Exists(Path.GetDirectoryName(sourcePath)))
            {
                FileInfo[] files = dicInfo.GetFiles();
                foreach (FileInfo file in files.OrderBy(f => int.Parse(f.Name)))
                {
                    FileStream addFile = new FileStream(targetPath, FileMode.Append, FileAccess.Write);
                    BinaryWriter AddWriter = new BinaryWriter(addFile);

                    //获得上传的分片数据流 
                    Stream stream = file.Open(FileMode.Open);
                    BinaryReader TempReader = new BinaryReader(stream);
                    //将上传的分片追加到临时文件末尾
                    AddWriter.Write(TempReader.ReadBytes((int)stream.Length));
                    //关闭BinaryReader文件阅读器
                    TempReader.Close();
                    stream.Close();
                    AddWriter.Close();
                    addFile.Close();

                    TempReader.Dispose();
                    stream.Dispose();
                    AddWriter.Dispose();
                    addFile.Dispose();
                }
                DeleteFolder(sourcePath);

                attach.code = 0;//成功
                attach.errormsg = "";
                attach.chunked = true;//进行了分片处理
                attach.hasError = false;
                context.Response.Write(JsonConvert.SerializeObject(attach));
            }
            else
            {
                attach.code = 0;//成功
                attach.errormsg = "";
                attach.chunked = true;//进行了分片处理
                attach.hasError = true;
                context.Response.Write(JsonConvert.SerializeObject(attach));
            }
        }
        #endregion

        #region 删除文件夹及其内容
        /// <summary>
        /// 删除文件夹及其内容
        /// </summary>
        /// <param name="dir"></param>
        private void DeleteFolder(string strPath)
        {
            //删除这个目录下的所有子目录
            if (Directory.GetDirectories(strPath).Length > 0)
            {
                foreach (string fl in Directory.GetDirectories(strPath))
                {
                    Directory.Delete(fl, true);
                }
            }
            //删除这个目录下的所有文件
            if (Directory.GetFiles(strPath).Length > 0)
            {
                foreach (string f in Directory.GetFiles(strPath))
                {
                    System.IO.File.Delete(f);
                }
            }
            Directory.Delete(strPath, true);
        }
        #endregion

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }

    public class AttachInfo
    {
        /// <summary>
        /// 返回代码，成功0 失败 1
        /// </summary>
        public int code { get; set; }

        /// <summary>
        /// 错误信息
        /// </summary>
        public string errormsg { get; set; }

        /// <summary>
        /// 文件分片大小
        /// </summary>
        public int chunk { get; set; }

        /// <summary>
        /// 文件名称
        /// </summary>
        public string name { get; set; }

        /// <summary>
        /// 文件路径(虚拟)
        /// </summary>
        public string path { get; set; }

        /// <summary>
        /// 文件大小
        /// </summary>
        public long size { get; set; }

        /// <summary>
        /// 扩展名
        /// </summary>
        public string extension { get; set; }

        /// <summary>
        /// md5值
        /// </summary>
        public string md5 { get; set; }

        /// <summary>
        /// 文件是否存在
        /// </summary>
        public bool exists { get; set; }

        /// <summary>
        /// 是否进行了分片处理
        /// </summary>
        public bool chunked { get; set; }

        /// <summary>
        /// 是否出现错误
        /// </summary>
        public bool hasError { get; set; }

        /// <summary>
        /// 全路径
        /// </summary>
        public string fullPath { get; set; }
    }
}